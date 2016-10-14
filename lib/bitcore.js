/* @flow
 * Interface to bitcore-node blockchain backend
 */

import 'whatwg-fetch';

import {
    Transaction,
} from 'bitcoinjs-lib';
import {
    Set as ImmutableSet
} from 'immutable';

import { Stream, Emitter } from './stream';
import { TransactionInfo } from './transaction';

import type {
    InMessage as SocketWorkerInMessage,
    OutMessage as SocketWorkerOutMessage
} from './socket-worker';

export type TransactionMatch = {
    info: TransactionInfo;
    addresses: Array<string>;
};

export type SyncStatus = { height: number; };

export type Blockchain = {
    errors: Stream<Error>;
    notifications: Stream<TransactionMatch>;
    reconnections: Stream<void>;
    blocks: Stream<void>;

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
    lookupTransactionAsMatch(hash: string): Promise<TransactionMatch>;
    lookupBlockHash(height: number): Promise<string>;
    lookupSyncStatus(): Promise<SyncStatus>;
    sendTransaction(hex: string): Promise<string>;
};

type BcSyncStatus = { height: number; };
type BcTransactionInfo = {
    tx: BcDetailedTransaction;
    confirmations: number; // 0 if no
    satoshis: number; // not sure what this means
};
type BcHistory = { addresses: { [address: string]: Object; }; } & BcTransactionInfo;
type BcHistories = { items: Array<BcHistory>; totalCount: number; };

type BcDetailedTransaction = {
    blockTimestamp: ?number; // undef on unconfirmed
    feeSatoshis: number;
    hash: string;
    height: number; // -1 on unconfirmed
    hex: string;
    inputSatoshis: number;
    inputs: Array<BcDetailedInput>;
    locktime: number;
    outputSatoshis: number;
    outputs: Array<BcDetailedOutput>;
    version: number;
}

type BcDetailedInput = {
    address: ?string;
    outputIndex: ?number;
    prevTxId: ?string; // coinbase
    satoshis: number;
    script: string;
    scriptAsm: ?string;
    sequence: number;
}

type BcDetailedOutput = {
    address: ?string;
    satoshis: number;
    script: string;
    scriptAsm: string;
}

export class BitcoreBlockchain {
    errors: Stream<Error>; // socket errors
    reconnections: Stream<void>; // socket reconnections
    notifications: Stream<TransactionMatch>; // activity on subscribed addresses
    blocks: Stream<void>;

    addresses: ImmutableSet<string>; // subscribed addresses
    socket: Socket;

    constructor(endpoint: string, socketWorkerFactory: () => Worker) {
        this.addresses = new ImmutableSet();
        this.socket = new Socket(socketWorkerFactory, endpoint);
        this.errors = this.socket.observe('error');
        this.reconnections = this.socket.observe('reconnect');
        //this.notifications = this.socket.observe('bitcoind/transaction').map(
        this.notifications = this.socket.observe('bitcoind/addresstxid').mapPromise(
            ({txid}) =>
                this.lookupTransactionAsMatch(txid)
        );
        this.socket.subscribe('bitcoind/hashblock');
        this.blocks = this.socket.observe('bitcoind/hashblock');
    }

    subscribe(addresses: Array<string>) {
        addresses = addresses.filter((a) => !(this.addresses.has(a)));
        this.addresses = this.addresses.merge(addresses);
        if (addresses.length !== 0) {
            this.socket.subscribe('bitcoind/addresstxid', addresses);
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

    lookupTransaction(hash: string): Promise<TransactionInfo> {
        return lookupDetailedTransaction(this.socket, hash)
            .then((info) => detailedToInfo(info, false));
    }

    lookupTransactionAsMatch(hash: string): Promise<TransactionMatch> {
        return lookupDetailedTransaction(this.socket, hash)
            .then((info) => detailedToTransactionMatch(info, true));
    }

    sendTransaction(hex: string): Promise<string> {
        return sendTransaction(this.socket, hex);
    }

    lookupBlockHash(height: number): Promise<string> {
        return lookupBlockHash(this.socket, height);
    }

    lookupSyncStatus(): Promise<BcSyncStatus> {
        return lookupSyncStatus(this.socket);
    }

    historyToMatch(r: BcHistory): TransactionMatch {
        return {
            info: detailedToInfo(r.tx, true),
            addresses: Object.keys(r.addresses),
        };
    }
}

function detailedToInfo(r: BcDetailedTransaction, neuter: boolean): TransactionInfo {
    return new TransactionInfo(
        bitcoreToTransaction(r, neuter),
        r.hash,
        r.outputs.map(o => o.address),
        r.height > 0 ? r.height : null,
        r.blockTimestamp
    );
}

function detailedToTransactionMatch(r: BcDetailedTransaction, neuter: boolean): TransactionMatch {
    // just put in all addresses (since we don't know which ones matched)
    const addressesObj = {};
    r.inputs.forEach(inp => {
        const address = inp.address;
        if (address != null) {
            addressesObj[address] = 1;
        }
    });
    r.outputs.forEach(outp => {
        const address = outp.address;
        if (address != null) {
            addressesObj[address] = 1;
        }
    });
    const addresses = Object.keys(addressesObj);
    return {
        info: detailedToInfo(r, neuter),
        addresses
    };
}

const EMPTY_BUFFER = new Buffer(0);

function bitcoreToTransaction(r: BcDetailedTransaction, neutered: boolean = true): Transaction {
    let tx = Transaction.fromHex(r.hex);

    if (neutered) {
        tx.ins.forEach(input => input.script = EMPTY_BUFFER);
        if (tx.joinsplits != null) {
            tx.joinsplits = tx.joinsplits.map(js => {
                return {
                    vpubNew: js.vpubNew,
                    vpubOld: js.vpubOld
                }
            });
        }
    }

    return tx;
}


function lookupAllAddressHistories(
    socket: Socket,
    addresses: Array<string>,
    start: ?number,
    end: ?number,
    pageLength: number = 50
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
function lookupDetailedTransaction(socket: Socket, hash: string): Promise<Object> {
    let method = 'getDetailedTransaction';
    let params = [
        hash
    ];
    return socket.send({ method, params });
}

function sendTransaction(socket: Socket, hex: string): Promise<string> {
    let method = 'sendTransaction';
    let params = [
        hex,
    ];
    return socket.send({ method, params });
}

function lookupBlockHash(socket: Socket, height: number): Promise<string> {
    let method = 'getBlockHeader';
    let params = [height]
    return socket.send({method, params}).then(res => res.hash);
}

function lookupSyncStatus(socket: Socket): Promise<BcSyncStatus> {
    let method = 'getInfo';
    let params = []
    return socket.send({method, params}).then(res => {return {height: res.blocks}});
}


class SocketWorkerHandler {
    _worker: ?Worker;
    workerFactory: () => Worker;
    _emitter: ?Emitter<SocketWorkerOutMessage>;
    counter: number;

    constructor(workerFactory: () => Worker) {
        this.workerFactory = workerFactory;
        this.counter = 0;
    }

    _tryWorker(endpoint: string, type: string): Promise<Worker> {
        const worker = this.workerFactory();
        const dfd = deferred();
        worker.onmessage = (message) => {
            let data = message.data;
            if (typeof data === 'string') {
                let parsed = JSON.parse(data);
                if (parsed.type === 'initDone') {
                    dfd.resolve(worker);
                } else {
                    dfd.reject(new Error('Connection failed.'));
                }
            }
        }

        worker.postMessage(JSON.stringify({
            type: 'init',
            endpoint: endpoint,
            connectionType: type
        }));
        return dfd.promise;
    }

    init(endpoint: string): Promise<void> {
        return this._tryWorker(endpoint, 'websocket')
            .catch(() => this._tryWorker(endpoint, 'polling'))
            .then((worker) => {
                this._worker = worker;
                let emitter = new Emitter();
                worker.onmessage = (message) => {
                    let data = message.data;
                    if (typeof data === 'string') {
                        emitter.emit(JSON.parse(data));
                    }
                };
                this._emitter = emitter;
                return;
            });
    }

    send(message: Object): Promise<any> {
        this.counter++;
        const counter = this.counter;
        this._sendMessage({
            type: 'send',
            message: message,
            id: counter
        });
        const dfd = deferred();
        if (this._emitter == null) {
            return Promise.reject(new Error('Socket not set.'));
        }
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

    observe(event: string): Stream<any> {
        this.counter++;
        const counter = this.counter;
        this._sendMessage({
            type: 'observe',
            event: event,
            id: counter
        });

        if (this._emitter == null) {
            throw new Error('Socket not set.');
        }
        const emitter = this._emitter;

        return Stream.fromEmitter(
            emitter,
            () => {
                this._sendMessage({
                    type: 'unobserve',
                    event: event,
                    id: counter
                });
            }
        )
        .filter((message) => message.type === 'emit' && message.event === event)
        .map((message) => {
            if (message.data) {
                return message.data;
            }
            return null;
        });
    }

    subscribe(event: string, ...values: Array<any>) {
        this._sendMessage({
            type: 'subscribe',
            event: event,
            values: values
        });
    }

    _sendMessage(message: SocketWorkerInMessage) {
        if (this._worker == null) {
            return Promise.reject(new Error('Socket not set.'));
        }

        this._worker.postMessage(JSON.stringify(message));
    }
}

class Socket {
    endpoint: string;
    socket: SocketWorkerHandler;
    _socketInited: Promise<void>;

    constructor(workerFactory: () => Worker, endpoint: string) {
        this.endpoint = endpoint;
        this.socket = new SocketWorkerHandler(workerFactory);
        this._socketInited = this.socket.init(this.endpoint);
    }

    send<U>(message: Object): Promise<U> {
        return this._socketInited.then(() => this.socket.send(message));
    }

    observe<T>(event: string): Stream<T> {
        return Stream.fromPromise(this._socketInited.then(() => this.socket.observe(event)));
    }

    subscribe(event: string, ...values: Array<any>) {
        return this._socketInited.then(() => this.socket.subscribe(event, ...values));
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
