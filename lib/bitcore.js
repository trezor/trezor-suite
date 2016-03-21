/* @flow
 * Interface to bitcore-node blockchain backend
 */

import 'whatwg-fetch';

import { Transaction, address as baddress } from 'bitcoinjs-lib';
import type { Input, Output } from 'bitcoinjs-lib';
import socketIO from 'socket.io-client';

import { Stream } from './stream';
import { TransactionInfo } from './transaction';

export type TransactionMatch = {
    info: TransactionInfo;
    addresses: Array<string>;
    rejected: boolean;
};

export type SyncStatus = { height: number; };

export type Blockchain = {
    socket: Socket;
    notifications: Stream<TransactionMatch>;

    subscribe(addresses: Array<string>): void;
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
type BcTransactionInfo = { tx: BcTransaction; height: ?number; timestamp: ?number; };
type BcHistory = { addresses: { [address: string]: Object; }; } & BcTransactionInfo;
type BcHistories = { items: Array<BcHistory>; totalCount: number; };
type BcNotification = { address: string; rejected: boolean; } & BcTransactionInfo;

export class BitcoreBlockchain {
    errors: Stream<Error>; // socket errors
    notifications: Stream<TransactionMatch>; // activity on subscribed addresses
    transactions: Map<string, Transaction>; // txs interned by id
    addresses: Set<string>; // subscribed addresses
    socket: Socket;

    constructor(endpoint: string, options: SocketOptions) {
        this.transactions = new Map;
        this.addresses = new Set;
        this.socket = new Socket(endpoint, options);
        this.errors = this.socket.observe('error');
        this.notifications = this.socket.observe('address/transaction').map(
            (r) => this.notificationToMatch(r)
        );
    }

    subscribe(addresses: Array<string>) {
        addresses = addresses.filter((a) => !(this.addresses.has(a)));
        addresses.forEach((a) => this.addresses.add(a));
        this.socket.subscribe('address/transaction', addresses);
    }

    lookupTransactions(
        addresses: Array<string>,
        start: ?number = null,
        end: ?number = null
    ): Promise<Array<TransactionMatch>> {
        return lookupAllAddressHistories(
            this.socket,
            addresses,
            start,
            end
        ).then((r) => r.items.map((item) => this.historyToMatch(item)));
    }

    lookupTransaction(hash: string): Promise<TransactionInfo> {
        return lookupTransaction(this.socket, hash).then((r) => this.toInfo(r));
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
        return {
            info: this.toInfo(r),
            addresses: [r.address],
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
            this.transactions.set(id, tx);
        }
        return new TransactionInfo(tx, id, r.height, r.timestamp);
    }
}

function bitcoreToTransaction(r: BcTransaction): Transaction {
    let tx = new Transaction;

    tx.version = r.version;
    tx.locktime = r.nLockTime;

    tx.ins = r.inputs.map((ir): Input => {
        let script = new Buffer(ir.script, 'hex');
        let hash = new Buffer(ir.prevTxId, 'hex');
        let id = ir.prevTxId;

        Array.prototype.reverse.call(hash);

        return {
            script,
            hash,
            id,
            index: ir.outputIndex >>> 0,
            sequence: ir.sequenceNumber >>> 0,
        };
    });

    tx.outs = r.outputs.map((or): Output => {
        let script = new Buffer(or.script, 'hex');
        let address;

        // TODO: pull the address out of BcHistory or BcNotification
        try {
            address = baddress.fromOutputScript(script);
        } catch (e) {
            console.warn('Error while parsing output script', e);
            address = null;
        }

        return {
            address,
            script,
            value: or.satoshis,
        };
    });

    return tx;
}

function lookupAllAddressHistories(
    socket: Socket,
    addresses: Array<string>,
    start: ?number,
    end: ?number,
    pageLength: number = 100
): Promise<BcHistories> {
    let lookup = (from, to) => {
        return lookupAddressHistories(socket, addresses, from, to, start, end);
    };
    let iterate = (result) => {
        let { totalCount } = result;
        if (totalCount <= pageLength) {
            // we have all results already
            return result;
        } else {
            // there are some transactions left, lookup them in parallel by
            // pageLength chunks and concatenate the results
            let promises = [];
            for (let i = pageLength; i < totalCount; i += pageLength) {
                let to = i + pageLength;
                promises.push(lookup(i, (to > totalCount ? totalCount : to)));
            }
            return Promise.all(promises).then((results) => {
                let items = results.reduce(
                    (items, result) => items.concat(result.items),
                    result.items
                );
                return { items, totalCount };
            });
        }
    };
    return lookup(0, pageLength).then(iterate);
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

function lookupTransaction(socket: Socket, hash: string): Promise<BcTransactionInfo> {
    let method = 'getTransaction';
    let params = [
        hash,
        true, // queryMempool
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

// requires insight-api bitcore-node plugin
function lookupBlockHash(socket: Socket, height: number): Promise<string> {
    return socket.sendToInsight(`insight-api/block-index/${height}`)
                 .then((r) => r.blockHash);
}

// requires insight-api bitcore-node plugin
function lookupSyncStatus(socket: Socket): Promise<BcSyncStatus> {
    return socket.sendToInsight(`insight-api/sync`);
}

type SocketOptions = {
    upgrade: boolean;
};

class Socket {
    endpoint: string;
    socket: socketIO;

    constructor(endpoint: string, options: SocketOptions) {
        this.endpoint = endpoint;
        this.socket = socketIO(endpoint, options);
    }

    isConnected(): boolean {
        return this.socket.connected;
    }

    send<T, U>(message: T): Promise<U> {
        return sendToSocket(this.socket, message);
    }

    sendToInsight<U>(path: string): Promise<U> {
        return fetchResponse(this.endpoint, path);
    }

    observe<T>(event: string): Stream<T> {
        return observeSocket(this.socket, event);
    }

    subscribe(event: string, ...values: Array<any>) {
        this.socket.emit('subscribe', event, ...values);
    }
}

function sendToSocket<T, U>(socket: socketIO, message: T): Promise<U> {
    return new Promise((resolve, reject) => {
        socket.send(message, ({error, result}) => {
            if (error) {
                reject(new Error(error.message));
            } else {
                resolve(result);
            }
        });
    });
}

function observeSocket<T>(socket: socketIO, event: string): Stream<T> {
    return new Stream((update, finish) => {
        socket.on(event, update);
        return () => { socket.off(update); };
    });
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
