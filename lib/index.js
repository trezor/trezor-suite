import {EventEmitter} from 'events';
import {HDNode} from 'bitcoinjs-lib';
import {TxInfo, Blockchain} from './bitcore';

class NativeAddressSource {

    constructor(node) {
        // TODO: address version
        this.node = node;
    }

    derive(firstIndex, lastIndex) {
        let as = [];
        for (let i = firstIndex; i <= lastIndex; i++) {
            as.push(this.node.derive(i).getAddress());
        }
        return Promise.resolve(as);
    }
}

// requires an exclusive access to worker.
// requires worker to reply in a linear manner (strict FIFO).
class WorkerChannel {

    constructor(worker) {
        this.worker = worker;
        this.pending = [];
        this.receiveMessage = this.receiveMessage.bind(this);
        this.receiveError = this.receiveError.bind(this);
        this.open();
    }

    open() {
        this.worker.addEventListener('message', this.receiveMessage);
        this.worker.addEventListener('error', this.receiveError);
    }

    close() {
        this.worker.removeEventListener('message', this.receiveMessage);
        this.worker.removeEventListener('error', this.receiveError);
    }

    postMessage(msg) {
        return new Promise((resolve, reject) => {
            this.pending.push({resolve, reject});
            this.worker.postMessage(msg);
        });
    }

    receiveMessage(event) {
        let dfd = this.pending.shift();
        if (dfd) {
            dfd.resolve(event.data);
        }
    }

    receiveError(error) {
        let dfd = this.pending.shift();
        if (dfd) {
            dfd.reject(error);
        }
    }
}

class WorkerAddressSource {

    constructor(channel, node, version) {
        this.channel = channel;
        this.node = {
            depth: node.depth,
            child_num: node.index,
            fingerprint: node.parentFingerprint,
            chain_code: node.chainCode,
            public_key: node.keyPair.getPublicKeyBuffer()
        };
        this.version = version;
    }

    derive(firstIndex, lastIndex) {
        let request = {
            type: 'deriveAddressRange',
            node: this.node,
            version: this.version,
            firstIndex,
            lastIndex
        };
        return this.channel.postMessage(request)
            .then(({addresses}) => addresses);
    }
}

class PrefatchingSource {

    constructor(source) {
        this.source = source;
        this.prefatched = null;
    }

    derive(firstIndex, lastIndex) {
        let promise;

        if (this.prefatched
            && this.prefatched.firstIndex === firstIndex
            && this.prefatched.lastIndex === lastIndex) {

            promise = this.prefatched.promise;
        } else {
            promise = this.source.derive(firstIndex, lastIndex);
        }
        this.prefatched = null;

        return promise.then((result) => {
            let nf = lastIndex + 1;
            let nl = lastIndex + 1 + (lastIndex - firstIndex);
            let next = this.source.derive(nf, nl);

            this.prefatched = {
                firstIndex: nf,
                lastIndex: nl,
                promise: next
            };

            return result;
        });
    }
}

class CachingSource {

    constructor(source) {
        this.source = source;
        this.cache = Object.create(null);
    }

    store() {
        return {
            cache: this.cache
        };
    }

    restore(data) {
        this.cache = data.cache;
    }

    derive(firstIndex, lastIndex) {
        let key = `${firstIndex}-${lastIndex}`;

        if (this.cache[key] !== undefined) {
            return Promise.resolve(this.cache[key]);

        } else {
            return this.source.derive(firstIndex, lastIndex)
                .then((result) => this.cache[key] = result);
        }
    }
}

class Chain {

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

class TxDatabase {

    constructor() {
        this.indexes = Object.create(null); // tx id -> index
        this.infos = Object.create(null);   // index -> tx info
        this.nextIndex = 0;
    }

    store() {
        let data = [];

        for (let index in this.infos) {
            let info = this.infos[index];
            let item = info.toJSON();
            data.push(item);
        }

        return data;
    }

    restore(data) {
        data.forEach((item) => {
            let info = TxInfo.fromJSON(item);
            this.update(info);
        });
    }

    indexOf(info) { return this.indexes[info.id]; }
    infoOf(index) { return this.infos[index]; }
    infoOfId(id) { return this.infos[this.indexes[id]]; }

    update(info) {
        let index = this.indexes[info.id];
        if (index === undefined) {
            index = this.nextIndex++;
            this.indexes[info.id] = index;
        }
        this.infos[index] = info;
    }
}

class ChainHistory {

    constructor(database) {
        this.database = database;
        // TODO: consider storing only the tx ids or indexes, and looking up the
        // infos in database on demand. now we store direct TxInfo references,
        // which means they can theoretically point to the same tx but different
        // block info, and we rely on Blockchain notifications taking care of
        // that and updating all references to the same information. oh well...
        this.histories = Object.create(null); // address index -> [tx info]
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
            let indexes = history.map((info) => this.database.indexOf(info));
            data.list[index] = indexes;
        }

        return data;
    }

    restore(data) {
        for (let index = 0; index < data.list.length; index++) {
            let indexes = data.list[index];
            if (indexes == null) {
                continue;
            }
            let history = indexes.map((index) => this.database.infoOf(index));
            this.histories[index] = history;
            if (this.nextIndex <= index) {
                this.nextIndex = index + 1;
            }
        }
        this.untilBlock = data.untilBlock;
    }

    update(info, index) {
        if (this.histories[index]) {
            this.histories[index].push(info);
        } else {
            this.histories[index] = [info];
        }
        if (this.nextIndex <= index) {
            this.nextIndex = index + 1;
        }
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
class ChainDiscovery extends EventEmitter {

    constructor(chain, history, blockchain, gapLength) {
        super();
        this.chain = chain;
        this.history = history;
        this.blockchain = blockchain;
        this.gapLength = gapLength;

        this.sinceHeight = null;
        this.untilHeight = null;
    }

    start() {
        this.updateBlockInfo()
            .then(() => {
                this.blockchain.on('transaction', (result) => {
                    this.update([result]);
                });
                this.nextChunk();
            })
            .catch((error) => { this.emit('error', error); });
    }

    updateBlockInfo() {
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

                this.blockchain.lookupTxs(addresses, this.untilHeight, this.sinceHeight)
                    .then((results) => { this.update(results); })
                    .catch((error) => { this.emit('error', error); });
            })
            .catch((error) => { this.emit('error', error); })
    }

    update(results) {
        let anyResult = false;

        results.forEach(({info, addresses}) => {
            let anyAddress = false;

            addresses.forEach((address) => {
                let index = this.chain.indexOf(address);
                if (index !== undefined) {
                    anyAddress = true;
                    this.history.update(info, index);
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

function createAddressSource(channel, node, addressVersion) {
    let source;
    source = new WorkerAddressSource(channel, node, addressVersion);
    source = new PrefatchingSource(source);
    source = new CachingSource(source);
    return source;
}

function createChainDiscovery(source, database, blockchain, chunkSize, gapLength) {
    let chain = new Chain(source, chunkSize);
    let history = new ChainHistory(database);
    let discovery = new ChainDiscovery(chain, history, blockchain, gapLength);
    return discovery;
}

class AccountDiscovery extends EventEmitter {

    constructor(sources, blockchain, chunkSize, gapLength) {
        super();
        this.sources = sources;
        this.blockchain = blockchain;
        this.chunkSize = chunkSize;
        this.gapLength = gapLength;

        this.database = new TxDatabase();
        this.discoveries = sources.map((source, index) => {
            let discovery = createChainDiscovery(
                source,
                this.database,
                this.blockchain,
                this.chunkSize,
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
        });
        this.receivedHistories = 0;
    }

    store() {
        return {
            database: this.database.store(),
            sources: this.sources.map((s) => s.store()),
            histories: this.discoveries.map((d) => d.history.store())
        };
    }

    restore(data) {
        this.database.restore(data.database);
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
    }

    update() {
        // TODO: when a tx affecting both chains is received, we waste cpu by
        // doing 2 updates here.  maybe we can batch all updates in a single
        // tick, ignore updates by the same tx, or some other trick?
        this.receivedHistories += 1;
        if (this.receivedHistories >= this.discoveries.length) {
            this.emit('history', this.discoveries.map((d) => d.history));
        }
    }
}

const TREZORCRYPTO_URL = '/lib/trezor-crypto/emscripten/trezor-crypto.js';
const BITCORE_URL = 'http://dev.sldev.cz:3001';

// global
let blockchain = new Blockchain(BITCORE_URL);
let worker = new Worker(TREZORCRYPTO_URL);
let channel = new WorkerChannel(worker);

let storage;

function discoverAccount(node) {
    const chunkSize = 20; // for derivation and blockchain lookup
    const gapLength = 20;
    const addressVersion = 0x0;

    let external = createAddressSource(channel, node.derive(0), addressVersion);
    let internal = createAddressSource(channel, node.derive(1), addressVersion);
    let sources = [external, internal];

    let discovery = new AccountDiscovery(sources, blockchain, chunkSize, gapLength);

    console.time('discovery');

    if (storage) {
        discovery.restore(storage);
    }

    discovery.on('transaction', (record, discovery, index) => {
        console.log(index, record);
    });

    discovery.on('history', (histories) => {
        console.timeEnd('discovery');
        console.log('external length', histories[0].nextIndex);
        console.log('internal length', histories[1].nextIndex);
        storage = discovery.store();
    });

    discovery.on('error', (error) => {
        console.timeEnd('discovery');
        console.error(error);
    });

    discovery.start();
}

window.run = () => {
    const XPUB = '...';
    discoverAccount(HDNode.fromBase58(XPUB));
};
