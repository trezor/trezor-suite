/* @flow
 * Interface to bitcore-node blockchain backend
 */

import 'whatwg-fetch';

import {
    Transaction,
    address as baddress,
    networks as bnetworks
} from 'bitcoinjs-lib';
import {
    Map as ImmutableMap,
    Set as ImmutableSet
} from 'immutable';

import type { Input, Output, Network } from 'bitcoinjs-lib';

import { Stream, Emitter } from './stream';
import { TransactionInfo } from './transaction';

import type { SocketOptions } from './socket-worker';
import type {
    InMessage as SocketWorkerInMessage,
    OutMessage as SocketWorkerOutMessage
} from './socket-worker';

export type TransactionMatch = {
    info: TransactionInfo;
    addresses: Array<string>;
    rejected: boolean;
};

export type SyncStatus = { height: number; };

export type Blockchain = {
    errors: Stream<Error>;
    notifications: Stream<TransactionMatch>;
    reconnections: Stream<void>;

    subscribe(addresses: Array<string>): void;
    lookupTransactionsStream(
        addresses: Array<string>,
        start: ?number,
        end: ?number
    ): Stream<Array<TransactionMatch>>;
    lookupTransactions(
        addresses: Array<string>,
        start: ?number,
        end: ?number
    ): Promise<Array<TransactionMatch>>;
    lookupTransaction(hash: string): Promise<TransactionInfo>;
    lookupBlockHash(height: number): Promise<string>;
    lookupSyncStatus(): Promise<SyncStatus>;
    sendTransaction(hex: string): Promise<string>;
};

type BcInput = {
    script: string;
    prevTxId: string;
    outputIndex: number;
    sequenceNumber: number;
};
type BcOutput = {
    script: string;
    satoshis: number;
};
type BcTransaction = {
    hash: string,
    version: number;
    nLockTime: number;
    inputs: Array<BcInput>;
    outputs: Array<BcOutput>;
};
type BcSyncStatus = { height: number; };
type BcTransactionInfo = { tx: BcTransaction; height: number; timestamp: ?number; };
type BcHistory = { addresses: { [address: string]: Object; }; } & BcTransactionInfo;
type BcHistories = { items: Array<BcHistory>; totalCount: number; };
type BcParsedAddress = { hash: string; network: string; type: string; };
type BcNotification = {
    address: BcParsedAddress;
    rejected: boolean;
    tx: BcTransaction;
    height?: number;
    timestamp?: ?number;
};

type InsightInput = {
    txid: string;
    vout: number;
    scriptSig: { hex: string; };
    sequence: number;
};
type InsightOutput = {
    value: string;
    scriptPubKey: { hex: string; };
};
type InsightTransactionInfo = {
    txid: string;
    version: number;
    locktime: number;
    vin: Array<InsightInput>;
    vout: Array<InsightOutput>;
    blockheight: number;
    time: number;
};

export class BitcoreBlockchain {
    errors: Stream<Error>; // socket errors
    reconnections: Stream<void>; // socket reconnections
    notifications: Stream<TransactionMatch>; // activity on subscribed addresses

    transactions: ImmutableMap<string, Transaction>; // txs interned by id
    addresses: ImmutableSet<string>; // subscribed addresses
    socket: Socket;

    constructor(endpoint: string, options: SocketOptions, socketWorker: Worker) {
        this.transactions = new ImmutableMap();
        this.addresses = new ImmutableSet();
        this.socket = new Socket(socketWorker, endpoint, options);
        this.errors = this.socket.observe('error');
        this.reconnections = this.socket.observe('reconnect');
        this.notifications = this.socket.observe('address/transaction').map(
            (r) => this.notificationToMatch(r)
        );
    }

    subscribe(addresses: Array<string>) {
        addresses = addresses.filter((a) => !(this.addresses.has(a)));
        this.addresses = this.addresses.merge(addresses);
        if (addresses.length !== 0) {
            this.socket.subscribe('address/transaction', addresses);
        }
    }

    lookupTransactionsStream(
        addresses: Array<string>,
        start: ?number = null,
        end: ?number = null
    ): Stream<Array<TransactionMatch>> {
        return lookupAllAddressHistories(
            this.socket,
            addresses,
            start,
            end
        ).map((r) => r.items.map((item) => this.historyToMatch(item)));
    }

    lookupTransactions(
        addresses: Array<string>,
        start: ?number = null,
        end: ?number = null
    ): Promise<Array<TransactionMatch>> {
        return this.lookupTransactionsStream(
            addresses,
            start,
            end
        ).reduce((previous, current) => previous.concat(current), []);
    }

    // requires insight-api, see:
    // https://github.com/bitpay/bitcore-node/issues/423
    lookupTransaction(hash: string): Promise<TransactionInfo> {
        return lookupInsightTransaction(this.socket, hash).then(
            (r) => this.insightToInfo(r)
        );
    }

    sendTransaction(hex: string): Promise<string> {
        return sendTransaction(this.socket, hex);
    }

    // requires insight-api
    lookupBlockHash(height: number): Promise<string> {
        return lookupBlockHash(this.socket, height);
    }

    // requires insight-api
    lookupSyncStatus(): Promise<BcSyncStatus> {
        return lookupSyncStatus(this.socket);
    }

    notificationToMatch(r: BcNotification): TransactionMatch {
        let bci = {
            // BcNotification don't have height and timestamp at all in case of
            // mempool notifications
            ...r,
            height: r.height != null ? r.height : -1,
            timestamp: r.timestamp != null ? r.timestamp : null,
        };
        return {
            info: this.toInfo(bci),
            addresses: [bitcoreToAddress(r.address)],
            rejected: r.rejected,
        };
    }

    historyToMatch(r: BcHistory): TransactionMatch {
        return {
            info: this.toInfo(r),
            addresses: Object.keys(r.addresses),
            rejected: false,
        };
    }

    toInfo(r: BcTransactionInfo): TransactionInfo {
        let id = r.tx.hash;
        let tx = this.transactions.get(id);
        if (tx == null) {
            tx = bitcoreToTransaction(r.tx);
            this.transactions = this.transactions.set(id, tx);
        }
        return new TransactionInfo(
            tx,
            id,
            null,
            r.height > 0 ? r.height : null,
            r.height > 0 ? r.timestamp : null
        );
    }

    insightToInfo(r: InsightTransactionInfo): TransactionInfo {
        let id = r.txid;
        // Commenting this out.
        // Transactions in this.transactions are neutered, but we need full txs
        // in order to stream them to trezor
        // let tx = this.transactions.get(id);
        // if (tx == null) {
        //     tx = insightToTransaction(r);
        //     this.transactions = this.transactions.set(id, tx);
        // }
        let tx = insightToTransaction(r);
        return new TransactionInfo(
            tx,
            id,
            null,
            r.blockheight > 0 ? r.blockheight : null,
            r.blockheight > 0 ? r.time : null
        );
    }
}

function insightToTransaction(r: InsightTransactionInfo): Transaction {
    let tx = new Transaction();

    tx.version = r.version;
    tx.locktime = r.locktime;

    tx.ins = r.vin.map((ir): Input => {
        if (ir.coinbase) {
            let hash = Buffer.alloc(32);
            let script = new Buffer(ir.coinbase, 'hex');
            let index = 0xFFFFFFFF;
            let sequence = ir.sequence;
            return {
              script,
              hash,
              index,
              sequence
            };
        } else {
            let script = new Buffer(ir.scriptSig.hex, 'hex');
            let hash = new Buffer(ir.txid, 'hex');

            Array.prototype.reverse.call(hash);

            return {
                script,
                hash,
                index: ir.vout >>> 0,
                sequence: ir.sequence >>> 0,
            };
        };
    });

    tx.outs = r.vout.map((or): Output => {
        let script = new Buffer(or.scriptPubKey.hex, 'hex');
        let value = Math.round(parseFloat(or.value) * 1e8);

        return {
            script,
            value,
        };
    });

    return tx;
}

const EMPTY_BUFFER = new Buffer(0);

function bitcoreToTransaction(r: BcTransaction, neutered: boolean = true): Transaction {
    let tx = new Transaction();

    tx.version = r.version;
    tx.locktime = r.nLockTime;

    tx.ins = r.inputs.map((ir): Input => {
        let script;
        if (neutered) {
            script = EMPTY_BUFFER;
        } else {
            script = new Buffer(ir.script, 'hex');
        }
        let hash = new Buffer(ir.prevTxId, 'hex');

        Array.prototype.reverse.call(hash);

        return {
            script,
            hash,
            index: ir.outputIndex >>> 0,
            sequence: ir.sequenceNumber >>> 0,
        };
    });

    tx.outs = r.outputs.map((or): Output => {
        let script = new Buffer(or.script, 'hex');

        return {
            script,
            value: or.satoshis,
        };
    });

    return tx;
}

function bitcoreToNetwork(s: string): Network {
    switch (s) {
        case 'livenet':
            return bnetworks.bitcoin;
        case 'testnet':
            return bnetworks.testnet;
        default:
            throw new TypeError(`Unknown bitcore network '${s}'`);
    }
}

function bitcoreToAddressVersion(n: Network, s: string): number {
    switch (s) {
        case 'pubkeyhash':
            return n.pubKeyHash;
        case 'scripthash':
            return n.scriptHash;
        default:
            throw new TypeError(`Unknown bitcore address version '${s}'`);
    }
}

function bitcoreToAddress(r: BcParsedAddress): string {
    let n = bitcoreToNetwork(r.network);
    let v = bitcoreToAddressVersion(n, r.type);
    let h = new Buffer(r.hash, 'hex');
    return baddress.toBase58Check(h, v);
}

function lookupAllAddressHistories(
    socket: Socket,
    addresses: Array<string>,
    start: ?number,
    end: ?number,
    pageLength: number = 100
): Stream<BcHistories & { from: number; to: number; }> {
    let initial = {
        from: 0,
        to: 0,
        items: [],
        totalCount: pageLength,
    };
    return Stream.generate(
        initial,
        (previous) => {
            let from = previous.to;
            let to = Math.min(
                previous.to + pageLength,
                previous.totalCount
            );
            return lookupAddressHistories(
                socket,
                addresses,
                from,
                to,
                start,
                end
            ).then((result) => ({
                ...result,
                from,
                to,
            }));
        },
        ({ to, totalCount }) => to < totalCount
    );
}

function lookupAddressHistories(
    socket: Socket,
    addresses: Array<string>,
    from: number,   // pagination from index (inclusive)
    to: number,     // pagination to index (not inclusive)
    start: ?number, // recent block height (inclusive)
    end: ?number    // older block height (inclusive)
): Promise<BcHistories> {
    let method = 'getAddressHistory';
    let params = [
        addresses,
        {
            from,
            to,
            start,
            end,
            queryMempool: true,
        },
    ];
    return socket.send({ method, params });
}

// https://github.com/bitpay/bitcore-node/issues/423
// function lookupTransaction(socket: Socket, hash: string): Promise<BcTransactionInfo> {
//     let method = 'getTransactionWithBlockInfo';
//     let params = [
//         hash,
//         true, // queryMempool
//     ];
//     return socket.send({ method, params });
// }

function sendTransaction(socket: Socket, hex: string): Promise<string> {
    let method = 'sendTransaction';
    let params = [
        hex,
    ];
    return socket.send({ method, params });
}

// requires insight-api bitcore-node plugin
function lookupBlockHash(socket: Socket, height: number): Promise<string> {
    return socket.sendToInsight(`block-index/${height}`)
                 .then((r) => r.blockHash);
}

// requires insight-api bitcore-node plugin
function lookupSyncStatus(socket: Socket): Promise<BcSyncStatus> {
    return socket.sendToInsight(`sync`);
}

// requires insight-api bitcore-node plugin
function lookupInsightTransaction(
    socket: Socket,
    hash: string
): Promise<InsightTransactionInfo> {
    return socket.sendToInsight(`tx/${hash}`);
}

class SocketWorkerHandler {
    worker: Worker;
    _emitter: Emitter<SocketWorkerOutMessage>;
    counter: number;

    constructor(worker: Worker, endpoint: string, options: SocketOptions) {
        this.worker = worker;
        this.counter = 0;

        let emitter = new Emitter();
        this.worker.onmessage = (message) => emitter.emit(JSON.parse(message.data));
        this._emitter = emitter;
        this._sendMessage({
            type: 'init',
            endpoint: endpoint,
            options: options
        });
    }

    send(message: Object): Promise {
        this.counter++;
        const counter = this.counter;
        this._sendMessage({
            type: 'send',
            message: message,
            id: counter
        });
        const dfd = deferred();
        this._emitter.attach((message, detach) => {
            if (message.type === 'sendReply' && message.id === counter) {
                const {result, error} = message.reply;
                if (error != null) {
                    dfd.reject(error);
                } else {
                    dfd.resolve(result);
                }
                detach();
            }
        });
        return dfd.promise;
    }

    observe(event: string): Stream {
        this.counter++;
        const counter = this.counter;
        this._sendMessage({
            type: 'observe',
            event: event,
            id: counter
        });

        return Stream.fromEmitter(
            this._emitter,
            () => {
                this._sendMessage({
                    type: 'unobserve',
                    event: event,
                    id: counter
                });
            }
        )
        .filter((message) => message.type === 'emit' && message.event === event)
        /* $FlowIssue - flow cannot refine through 2 functions */
        .map((message) => message.data);
    }

    subscribe(event: string, ...values: Array<any>) {
        this._sendMessage({
            type: 'subscribe',
            event: event,
            values: values
        });
    }

    _sendMessage(message: SocketWorkerInMessage) {
        this.worker.postMessage(JSON.stringify(message));
    }
}

class Socket {
    endpoint: string;
    options: SocketOptions;
    socket: SocketWorkerHandler;

    constructor(worker: Worker, endpoint: string, options: SocketOptions) {
        this.endpoint = endpoint;
        this.options = options;
        this.socket = new SocketWorkerHandler(worker, endpoint, options);
    }

    send<U>(message: Object): Promise<U> {
        return this.socket.send(message);
    }

    sendToInsight<U>(path: string): Promise<U> {
        return fetchResponse(
            this.endpoint,
            `${this.options.insightPath}/${path}`
        );
    }

    observe<T>(event: string): Stream<T> {
        return this.socket.observe(event);
    }

    subscribe(event: string, ...values: Array<any>) {
        return this.socket.subscribe(event, ...values);
    }
}

function fetchResponse<T>(endpoint: string, path: string): Promise<T> {
    return fetch(`${endpoint}/${path}`)
        .then((r) => assertStatus(r, 200))
        .then((r) => r.json());
}

function assertStatus(response, status) {
    if (response.status !== status) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    return response;
}

function deferred<T>(): {
    promise: Promise<T>,
    resolve: (t: T) => void,
    reject: (e: Error) => void
} {
    let resolve = (t:T) => {};
    let reject = (e: Error) => {};
    const promise = new Promise((inResolve, inReject) => {
        resolve = inResolve;
        reject = inReject;
    });
    return {
        promise,
        resolve,
        reject
    };
}
