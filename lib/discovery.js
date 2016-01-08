/* @flow
 * Discovery of transaction history for HD chains and accounts
 * TODO: split streams from streamed data, make data immutable
 */

import {EventEmitter} from 'events';
import type {TxCollection} from './transaction';
import type {TxResult, Blockchain} from './bitcore';
import type {Source, CachingSource, CachingSourceData} from './address';

export class Chain {

    source: Source;
    chunkSize: number;
    nextIndex: number;
    addresses: Map<number, string>;
    indexes: Map<string, number>;

    constructor(source: Source, chunkSize: number) {
        this.source = source;
        this.chunkSize = chunkSize;
        this.addresses = new Map;
        this.indexes = new Map;
        this.nextIndex = 0;
    }

    contains(address: string): boolean { return this.indexes.has(address); }
    indexOf(address: string): ?number { return this.indexes.get(address); }
    addressOf(index: number): ?string { return this.addresses.get(index); }

    nextChunk(): Promise<Array<string>> {
        let firstIndex = this.nextIndex;
        let lastIndex = this.nextIndex + this.chunkSize - 1;

        return this.source.derive(firstIndex, lastIndex).then((addresses) => {
            addresses.forEach((a, i) => {
                i += firstIndex;
                this.addresses.set(i, a);
                this.indexes.set(a, i);
                this.nextIndex = i + 1;
            });
            return addresses;
        });
    }
}

type ChainHistoryData = {
    histories: Array<[number, Array<string>]>;
    nextIndex: number;
    untilBlock: ?string;
};

export class ChainHistory {

    histories: Map<number, Array<string>>;
    nextIndex: number;
    untilBlock: ?string;

    constructor() {
        this.histories = new Map;
        this.nextIndex = 0;
        this.untilBlock = null;
    }

    store(): ChainHistoryData {
        return {
            histories: Array.from(this.histories),
            nextIndex: this.nextIndex,
            untilBlock: this.untilBlock
        };
    }

    restore(data: ChainHistoryData) {
        this.histories = new Map(data.histories);
        this.nextIndex = data.nextIndex;
        this.untilBlock = data.untilBlock;
    }

    update(id: string, index: number) {
        let history = this.histories.get(index);
        if (history != null) {
            history.push(id);
        } else {
            this.histories.set(index, [id]);
        }
        if (this.nextIndex <= index) {
            this.nextIndex = index + 1;
        }
    }

    isUsed(): boolean {
        return this.nextIndex > 0;
    }
}

type BlockRange = {
    sinceHeight: number;
    untilHeight: number;
    untilBlock: string;
};

function getBlockRange(
    blockchain: Blockchain,
    lastSeenBlock: ?string
): Promise<BlockRange> {

    let lastSeenHeight;
    if (lastSeenBlock) {
        lastSeenHeight = blockchain.lookupBlockIndex(lastSeenBlock)
            .then((index) => index.height);
    } else {
        lastSeenHeight = Promise.resolve(0);
    }

    let currentBlock = blockchain.lookupBestBlockHash();
    let currentHeight = currentBlock
        .then((hash) => blockchain.lookupBlockIndex(hash))
        .then((index) => index.height);

    let promises: Array<Promise<any>> = [
        lastSeenHeight,
        currentHeight,
        currentBlock
    ];
    return Promise.all(promises)
        .then(([sinceHeight, untilHeight, untilBlock]) => {
            return {sinceHeight, untilHeight, untilBlock};
        });
}

// emits 'transaction', 'history', 'error'
export class ChainDiscovery extends EventEmitter {

    chain: Chain;
    history: ChainHistory;
    collection: TxCollection;
    blockchain: Blockchain;
    gapLength: number;

    sinceHeight: ?number;
    untilHeight: ?number;

    onTransaction: (result: TxResult) => void;

    constructor(
        chain: Chain,
        history: ChainHistory,
        collection: TxCollection,
        blockchain: Blockchain,
        gapLength: number
    ) {
        super();
        this.chain = chain;
        this.history = history;
        this.collection = collection;
        this.blockchain = blockchain;
        this.gapLength = gapLength;

        this.sinceHeight = null;
        this.untilHeight = null;

        this.onTransaction = this.processTransaction.bind(this);
    }

    start() {
        // TODO: revise the block lookup strategy:
        // do we need to update the block info for every chain? we might use
        // timestamps to avoid the overhead.
        this.updateBlockInfo()
            .then(() => {
                this.blockchain.on('transaction', this.onTransaction);
                this.nextChunk();
            })
            .catch((error) => { this.emit('error', error); });
    }

    stop() {
        this.blockchain.removeListener('transaction', this.onTransaction);
    }

    processTransaction(result: TxResult) {
        this.update([result]);
    }

    updateBlockInfo(): Promise {
        // TODO: catch the reorg case and load the whole history
        return getBlockRange(this.blockchain, this.history.untilBlock).then(({
            sinceHeight, untilHeight, untilBlock
        }) => {
            this.sinceHeight = sinceHeight;
            this.untilHeight = untilHeight;
            this.history.untilBlock = untilBlock;
        });
    }

    nextChunk() {
        this.chain.nextChunk()
            .then((addresses) => {
                // TODO: revise subscription strategory:
                // maybe we could postpone the subscriptions until the whole
                // history is loaded, do it in much bigger chunks, and start
                // from the end? the code could be a bit more decoupled this way
                // (not everybody needs subscriptions) and general discovery
                // wouldn't get slowed down by the constant subscription
                // requests. tx arriving while the discovery is in progress is
                // likely to affect the end of the chain anyway, reverse
                // subscriptions should handle most of these cases.
                this.blockchain.subscribe(addresses);

                // TODO: de-duplicate downloaded transactions
                // this way, we download most of outgoing txs twice, as they
                // affect both external and internal chains. maybe it would be
                // worth to avoid it by looking up only tx summaries, and then
                // filling the tx collection with a parallel backend socket?
                // we already store only the tx ids...
                this.blockchain.lookupTxs(addresses, this.untilHeight, this.sinceHeight)
                    .then((results) => { this.update(results); })
                    .catch((error) => { this.emit('error', error); });
            })
            .catch((error) => { this.emit('error', error); });
    }

    update(results: Array<TxResult>) {
        let anyResult = false;

        results.forEach(({info, addresses}) => {
            let anyAddress = false;

            addresses.forEach((address) => {
                let index = this.chain.indexOf(address);
                if (index != null) {
                    anyAddress = true;
                    this.history.update(info.id, index);
                }
            });

            if (anyAddress) {
                anyResult = true;
                this.collection.update(info);
                this.emit('transaction', info);
            }
        });

        if (anyResult || results.length === 0) {
            if (this.gap() < this.gapLength) {
                this.nextChunk();
            } else {
                this.emit('history', this.history);
            }
        }
    }

    gap(): number {
        return this.chain.nextIndex - this.history.nextIndex;
    }
}

type AccountDiscoveryData = {
    sources: Array<CachingSourceData>;
    histories: Array<ChainHistoryData>;
};

// emits 'used', 'transaction', 'history', 'error'
export class AccountDiscovery extends EventEmitter {

    sources: Array<CachingSource>;
    collection: TxCollection;
    blockchain: Blockchain;
    chunkSize: number;
    gapLength: number;

    discoveries: Array<ChainDiscovery>;
    received: Array<number>;

    constructor(
        sources: Array<CachingSource>,
        collection: TxCollection,
        blockchain: Blockchain,
        chunkSize: number,
        gapLength: number
    ) {
        super();
        this.sources = sources;
        this.collection = collection;
        this.blockchain = blockchain;
        this.chunkSize = chunkSize;
        this.gapLength = gapLength;

        this.discoveries = sources.map((s, i) => this.create(s, i));
        this.received = [];
    }

    store(): AccountDiscoveryData {
        return {
            sources: this.sources.map((s) => s.store()),
            histories: this.discoveries.map((d) => d.history.store())
        };
    }

    restore(data: AccountDiscoveryData) {
        this.sources.forEach((s, i) => {
            s.restore(data.sources[i]);
        });
        this.discoveries.forEach((d, i) => {
            d.history.restore(data.histories[i]);
        });
    }

    start() {
        this.discoveries.forEach((d) => {
            d.start();
        });
        this.waitUntilUsed();
    }

    stop() {
        this.discoveries.forEach((d) => {
            d.stop();
        });
    }

    waitUntilUsed() {

        let onHistory = (histories) => {
            let isUsed = histories.some((h) => h.isUsed());
            if (!isUsed) {
                this.emit('used', false);
            }
            deregister();
        };

        let onTransaction = () => {
            this.emit('used', true);
            deregister();
        };

        var deregister = () => {
            this.removeListener('history', onHistory);
            this.removeListener('transaction', onTransaction);
        };

        this.once('history', onHistory);
        this.once('transaction', onTransaction);
    }

    create(source: Source, index: number): ChainDiscovery {
        let chain = new Chain(source, this.chunkSize);
        let history = new ChainHistory();
        let discovery = new ChainDiscovery(
            chain,
            history,
            this.collection,
            this.blockchain,
            this.gapLength
        );

        discovery.on('error', (error) => {
            this.emit('error', error, discovery, index);
        });
        discovery.on('transaction', (record) => {
            this.emit('transaction', record, discovery, index);
        });
        discovery.on('history', (history) => {
            this.update(history, discovery, index);
        });

        return discovery;
    }

    update(
        history: ChainHistory,
        discovery: ChainDiscovery,
        index: number
    ) {
        // TODO: merge 'history' events of multiple chain discoveries
        // when a notification affecting multiple chains is received, we waste
        // cpu by doing 2 updates here. maybe we can batch all updates in a
        // single tick, ignore updates by the same tx, or some other trick?

        let firstTime = this.received.indexOf(index) < 0;
        if (firstTime) {
            this.received.push(index);
        }
        let receivedAll = this.received.length === this.discoveries.length;
        if (receivedAll) {
            let histories = this.discoveries.map((d) => d.history);
            this.emit('history', histories);
        }
    }
}

type AccountDiscoveryFactory = (index: number) => Promise<AccountDiscovery>;

// emits 'account', 'end', 'error'
export class ListDiscovery extends EventEmitter {

    factory: AccountDiscoveryFactory;

    constructor(factory: AccountDiscoveryFactory) {
        super();
        this.factory = factory;
    }

    start(index: number = 0, atLeast: number = 1) {
        this.factory(index)
            .then((discovery) => {
                discovery.start();
                discovery.once('used', (used) => {
                    if (used || index < atLeast) {
                        let newIndex = index + 1;
                        let newAtLeast = (atLeast > 0) ? atLeast - 1 : 0;
                        this.emit('account', discovery, index);
                        this.start(newIndex, newAtLeast);
                    } else {
                        discovery.stop();
                        this.emit('end');
                    }
                });
            })
            .catch((error) => {
                this.emit('error', error);
            });
    }
}
