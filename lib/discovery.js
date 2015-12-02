import {EventEmitter} from 'events';

export class Chain {

    constructor(source, chunkSize) {
        this.source = source;
        this.chunkSize = chunkSize;
        this.addresses = Object.create(null);    // address index -> address
        this.indexes = Object.create(null);      // address -> address index
        this.nextIndex = 0;
    }

    indexOf(address) { return this.indexes[address]; }
    addressOf(index) { return this.addresses[index]; }

    nextChunk() {
        let firstIndex = this.nextIndex;
        let lastIndex = this.nextIndex + this.chunkSize - 1;

        return this.source.derive(firstIndex, lastIndex).then((addresses) => {
            addresses.forEach((a, i) => {
                i += firstIndex;
                this.addresses[i] = a;
                this.indexes[a] = i;
                this.nextIndex++;
            });
            return addresses;
        });
    }
}

export class ChainHistory {

    constructor(database) {
        this.database = database;
        this.histories = Object.create(null); // address index -> array of tx ids
        this.nextIndex = 0;
        this.untilBlock = null;
    }

    store() {
        // we use an array here to save space, as the number of holes is
        // expected to be small
        let data = {
            untilBlock: this.untilBlock,
            list: []
        };

        for (let index in this.histories) {
            let history = this.histories[index];
            data.list[index] = history;
        }

        return data;
    }

    restore(data) {
        for (let index = 0; index < data.list.length; index++) {
            let history = data.list[index];
            if (history == null) {
                continue;
            }
            this.histories[index] = history;
            if (this.nextIndex <= index) {
                this.nextIndex = index + 1;
            }
        }
        this.untilBlock = data.untilBlock;
    }

    update(id, index) {
        if (this.histories[index]) {
            this.histories[index].push(id);
        } else {
            this.histories[index] = [id];
        }
        if (this.nextIndex <= index) {
            this.nextIndex = index + 1;
        }
    }

    isUsed() {
        return this.nextIndex > 0;
    }
}

function getBlockRange(blockchain, lastSeenBlock) {
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

    return Promise.all([
        lastSeenHeight,
        currentHeight,
        currentBlock
    ]).then(([sinceHeight, untilHeight, untilBlock]) => {
        return { sinceHeight, untilHeight, untilBlock };
    });
}

// emits 'transaction', 'history', 'error'
export class ChainDiscovery extends EventEmitter {

    constructor(chain, history, blockchain, gapLength) {
        super();
        this.chain = chain;
        this.history = history;
        this.blockchain = blockchain;
        this.gapLength = gapLength;

        this.sinceHeight = null;
        this.untilHeight = null;

        this.onTransaction = this.onTransaction.bind(this);
    }

    start() {
        // TODO: do we need to update the block info for every chain? we might
        // use timestamps to avoid the overhead
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

    onTransaction(result) {
        this.update([result]);
    }

    updateBlockInfo() {
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
                // TODO: maybe we could postpone the subscriptions until the
                // whole history is loaded, do it in much bigger chunks, and
                // start from the end? the code could be a bit more decoupled
                // this way (not everybody needs subscriptions) and general
                // discovery wouldn't get slowed down by the constant
                // subscription requests. tx arriving while the discovery is in
                // progress is likely to affect the end of the chain anyway,
                // reverse subscriptions should handle most of these cases.
                this.blockchain.subscribe(addresses);

                // TODO: this way, we download most of outgoing txs twice, as
                // they affect both external and internal chains. maybe it would
                // be worth to avoid it by looking up only tx summaries, and
                // then filling the tx database with a parallel backend socket?
                // we already store only the tx ids...
                this.blockchain.lookupTxs(addresses, this.untilHeight, this.sinceHeight)
                    .then((results) => { this.update(results); })
                    .catch((error) => { this.emit('error', error); });
            })
            .catch((error) => { this.emit('error', error); });
    }

    update(results) {
        let anyResult = false;

        results.forEach(({info, addresses}) => {
            let anyAddress = false;

            addresses.forEach((address) => {
                let index = this.chain.indexOf(address);
                if (index !== undefined) {
                    anyAddress = true;
                    this.history.update(info.id, index);
                }
            });

            if (anyAddress) {
                anyResult = true;
                this.history.database.update(info);
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

    gap() {
        return this.chain.nextIndex - this.history.nextIndex;
    }
}

// emits 'used', 'transaction', 'history', 'error'
export class AccountDiscovery extends EventEmitter {

    constructor(sources, database, blockchain, chunkSize, gapLength) {
        super();
        this.sources = sources;
        this.database = database;
        this.blockchain = blockchain;
        this.chunkSize = chunkSize;
        this.gapLength = gapLength;

        this.discoveries = sources.map((s, i) => this.create(s, i));
        this.received = [];
    }

    store() {
        return {
            sources: this.sources.map((s) => s.store()),
            histories: this.discoveries.map((d) => d.history.store())
        };
    }

    restore(data) {
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
        let deregister;

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

        deregister = () => {
            this.removeListener('history', onHistory);
            this.removeListener('transaction', onTransaction);
        };
        this.once('history', onHistory);
        this.once('transaction', onTransaction);
    }

    create(source, index) {
        let chain = new Chain(source, this.chunkSize);
        let history = new ChainHistory(this.database);
        let discovery = new ChainDiscovery(
            chain,
            history,
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

    update(history, discovery, index) {
        // TODO: when a notification affecting multiple chains is received, we
        // waste cpu by doing 2 updates here. maybe we can batch all updates in
        // a single tick, ignore updates by the same tx, or some other trick?

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

// emits 'account', 'end', 'error'
export class ListDiscovery extends EventEmitter {

    constructor(factory) {
        super();
        this.factory = factory;
    }

    start(index = 0, atLeast = 1) {
        this.factory(index)
            .then(discovery => {
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
            .catch(error => {
                this.emit('error', error);
            });
    }
}
