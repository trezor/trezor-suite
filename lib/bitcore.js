/* @flow
 * Interface to bitcore-node blockchain backend
 */

import 'whatwg-fetch';

import {
    Transaction,
} from 'bitcoinjs-lib-zcash';
import {
    Set as ImmutableSet,
} from 'immutable';

import { Stream } from './stream';
import { PromiseIterable } from './promise-iterable';
import { TransactionInfo } from './transaction';
import { Socket } from './socket';
import { deferred } from './deferred';

import type { Deferred } from './deferred';

export type TransactionMatch = {
    info: TransactionInfo;
    addresses: Array<string>;
};

export type SyncStatus = { height: number; };

export type Blockchain = {
    errors: Stream<Error>;
    notifications: Stream<TransactionMatch>;
    blocks: Stream<void>;

    workingUrl: string;

    subscribe(addresses: Array<string>): void;
    lookupTransactionsStream(
        addresses: Array<string>,
        start: number,
        end: number
    ): Stream<Array<TransactionMatch> | Error>;
    lookupTransactions(
        addresses: Array<string>,
        start: number,
        end: number
    ): Promise<Array<TransactionMatch>>;
    lookupTransaction(hash: string): Promise<TransactionInfo>;
    lookupTransactionAsMatch(hash: string): Promise<TransactionMatch>;
    lookupBlockHash(height: number): Promise<string>;
    lookupSyncStatus(): Promise<SyncStatus>;
    sendTransaction(hex: string): Promise<string>;

    // this creates ANOTHER socket!
    // this is for repeated checks after one failure
    hardStatusCheck(): Promise<boolean>;
};

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

type BcSyncStatus = { height: number; };
type BcTransactionInfo = {
    tx: BcDetailedTransaction;
    confirmations: number; // 0 if no
    satoshis: number; // not sure what this means
};
type BcHistory = { addresses: { [address: string]: Object; }; } & BcTransactionInfo;
type BcHistories = { items: Array<BcHistory>; totalCount: number; };

type SocketWorkerFactory = () => Worker;
type BufferWorkerFactory = () => Worker;

export class BitcoreBlockchain {
    errors: Stream<Error>; // socket errors
    reconnections: Stream<void>; // socket reconnections
    notifications: Stream<TransactionMatch>; // activity on subscribed addresses
    blocks: Stream<void>;

    addresses: ImmutableSet<string>; // subscribed addresses
    socket: Deferred<Socket> = deferred();

    socketWorkerFactory: SocketWorkerFactory;
    bufferWorkerFactory: BufferWorkerFactory;
    endpoints: Array<string>;
    workingUrl: string = 'none';
    zcash: boolean;

    static _tryEndpoint(
        endpoints: Array<string>,
        socketWorkerFactory: SocketWorkerFactory,
        tried: {[k: string]: boolean}
    ): Promise<{socket: Socket, url: string}> {
        if (Object.keys(tried).length === endpoints.length + 1) {
            return Promise.reject(new Error('All backends are down.'));
        }
        let random = -1;
        while (tried[random.toString()]) {
            random = Math.floor(Math.random() * endpoints.length);
        }
        return onlineStatusCheck(socketWorkerFactory, endpoints[random]).then(socket => {
            if (socket) {
                return {socket, url: endpoints[random]};
            } else {
                tried[random.toString()] = true;
                return BitcoreBlockchain._tryEndpoint(endpoints, socketWorkerFactory, tried);
            }
        });
    }

    constructor(endpoints: Array<string>, socketWorkerFactory: SocketWorkerFactory, bufferWorkerFactory: BufferWorkerFactory, zcash: boolean) {
        this.addresses = new ImmutableSet();

        this.socketWorkerFactory = socketWorkerFactory;
        this.bufferWorkerFactory = bufferWorkerFactory;
        this.endpoints = endpoints;
        this.zcash = zcash;

        const lookupTM = (socket: Socket): Stream<TransactionMatch> => {
            return socket.observe('bitcoind/addresstxid').mapPromise(
                ({txid}) =>
                    this.lookupTransactionAsMatch(txid)
            );
        };
        const observeBlocks = (socket: Socket): Stream<void> => {
            socket.subscribe('bitcoind/hashblock');
            return socket.observe('bitcoind/hashblock');
        };

        const errors = Stream.setLater();
        const notifications = Stream.setLater();
        const blocks = Stream.setLater();
        this.errors = errors.stream;
        this.notifications = notifications.stream;
        this.blocks = blocks.stream;

        const tried = {'-1': true};
        BitcoreBlockchain._tryEndpoint(endpoints, socketWorkerFactory, tried).then(({socket, url}) => {
            this.workingUrl = url;
            this.socket.resolve(socket);
            errors.setter(observeErrors(socket));
            notifications.setter(lookupTM(socket));
            blocks.setter(observeBlocks(socket));
        }, () => {
            errors.setter(Stream.simple(new Error('All backends are offline.')));
            this.socket.reject(new Error('All backends are offline.'));
            this.socket.promise.catch((e) => console.error(e));
        });
    }

    // this creates ANOTHER socket!
    // this is for repeated checks after one failure
    hardStatusCheck(): Promise<boolean> {
        return PromiseIterable.fromIterable(this.endpoints).mapPromise((endpoint) =>
            onlineStatusCheck(this.socketWorkerFactory, endpoint)
        ).resolveAll().then((statuschecks) => {
            statuschecks.forEach(s => {
                if (s != null) {
                    s.close();
                }
            });
            const on = statuschecks.filter(i => i != null);
            return on.size > 0;
        });
    }

    subscribe(addresses: Array<string>) {
        this.socket.promise.then(socket => {
            addresses = addresses.filter((a) => !(this.addresses.has(a)));
            this.addresses = this.addresses.merge(addresses);
            if (addresses.length !== 0) {
                for (let i = 0; i < addresses.length; i += 20) {
                    socket.subscribe('bitcoind/addresstxid', addresses.slice(i, i + 20));
                }
            }
        }, () => {});
    }

    lookupTransactionsStream(
        addresses: Array<string>,
        start: number,
        end: number
    ): Stream<Array<TransactionMatch> | Error> {
        const res = Stream.fromPromise(
            this.socket.promise.then(socket => {
                return lookupAllAddressHistories(
                    socket,
                    addresses,
                    start,
                    end
                ).mapPromise((r) => {
                    if (r instanceof Error) {
                        return Promise.resolve(r);
                    }
                    return Promise.all(r.items.map((item) => historyToMatch(item, this.bufferWorkerFactory, this.zcash)));
                });
            })
        );
        // res.values.attach(foobar => {
        //     console.log("ARRIVED FROM BC", foobar);
        // });
        return res;
    }

    lookupTransactions(
        addresses: Array<string>,
        start: number,
        end: number
    ): Promise<Array<TransactionMatch>> {
        const maybeRes: Promise<Array<TransactionMatch> | Error> = this.lookupTransactionsStream(
            addresses,
            start,
            end
        ).reduce((
            previous: Array<TransactionMatch> | Error,
            current: Array<TransactionMatch> | Error
        ) => {
            if (previous instanceof Error) {
                return previous;
            }
            if (current instanceof Error) {
                return current;
            }
            return previous.concat(current);
        }, []);
        return maybeRes.then((maybeArray) => {
            if (maybeArray instanceof Error) {
                throw maybeArray;
            }
            return maybeArray;
        });
    }

    lookupTransaction(hash: string): Promise<TransactionInfo> {
        return this.socket.promise.then(socket =>
            lookupDetailedTransaction(socket, hash)
                .then((info) => detailedToInfo(info, this.bufferWorkerFactory, false, this.zcash))
        );
    }

    lookupTransactionAsMatch(hash: string): Promise<TransactionMatch> {
        return this.socket.promise.then(socket =>
            lookupDetailedTransaction(socket, hash)
                .then((info) => detailedToTransactionMatch(info, this.bufferWorkerFactory, true, this.zcash))
        );
    }

    sendTransaction(hex: string): Promise<string> {
        return this.socket.promise.then(socket =>
            sendTransaction(socket, hex)
        );
    }

    lookupBlockHash(height: number): Promise<string> {
        return this.socket.promise.then(socket =>
            lookupBlockHash(socket, height)
        );
    }

    lookupSyncStatus(): Promise<BcSyncStatus> {
        return this.socket.promise.then(socket =>
            lookupSyncStatus(socket)
        );
    }

}

function historyToMatch(r: BcHistory, factory: BufferWorkerFactory, zcash: boolean): Promise<TransactionMatch> {
    return detailedToInfo(r.tx, factory, true, zcash).then(transaction => {
        return {
            info: transaction,
            addresses: Object.keys(r.addresses),
        };
    });
}

function detailedToInfo(r: BcDetailedTransaction, workerFactory: BufferWorkerFactory, neuter: boolean, zcash: boolean): Promise<TransactionInfo> {
    return bitcoreToTransaction(r, workerFactory, neuter, zcash).then(transaction => {
        return new TransactionInfo(
            transaction,
            r.hash,
            r.outputs.map(o => o.address),
            r.height > 0 ? r.height : null,
            r.blockTimestamp
        );
    });
}

function detailedToTransactionMatch(r: BcDetailedTransaction, worker: BufferWorkerFactory, neuter: boolean, zcash: boolean): Promise<TransactionMatch> {
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
    return detailedToInfo(r, worker, neuter, zcash).then(info => {
        return {
            info,
            addresses,
        };
    });
}

const EMPTY_BUFFER = new Buffer(0);
let bufferWorker_ = null;

let previous: Promise<any> = Promise.resolve();
function convertBuffer(s: string, bufferWorkerFactory: BufferWorkerFactory): Promise<Buffer> {
    const bufferWorker = bufferWorker_ == null ? bufferWorkerFactory() : bufferWorker_;
    bufferWorker_ = bufferWorker;
    const res = previous.then(() => {
        const res: Promise<Buffer> = new Promise((resolve, reject) => {
            bufferWorker.onmessage = message => {
                // $FlowIssue
                if (message.data.type === 'error') {
                    // $FlowIssue
                    reject(new Error(message.data.text));
                } else {
                    // $FlowIssue
                    resolve(new Buffer(message.data.buffer));
                }
            };
        });
        bufferWorker.postMessage(s);
        return res;
    });
    previous = res;
    return previous;
}

function bitcoreToTransaction(r: BcDetailedTransaction, bufferWorkerFactory: BufferWorkerFactory, neutered: boolean, isZcash: boolean): Promise<Transaction> {
    return convertBuffer(r.hex, bufferWorkerFactory).then(b => {
        const tx = Transaction.fromBuffer(b, isZcash);

        if (neutered) {
            tx.ins.forEach(input => {
                input.script = EMPTY_BUFFER;
            });
            tx.joinsplits = [];
        }

        return tx;
    });
}

function lookupAllAddressHistories(
    socket: Socket,
    addresses: Array<string>,
    start: number,
    end: number,
    pageLength: number = 50,
): Stream<(BcHistories & { from: number; to: number; }) | Error> {
    return Stream.combineFlat([
        lookupAddressHistoriesMempool(socket, addresses, true, start, end),
        lookupAddressHistoriesMempool(socket, addresses, false, start, end),
    ]);
}

function lookupAddressHistoriesMempool(
    socket: Socket,
    addresses: Array<string>,
    mempool: boolean,
    start: number,
    end: number,
    pageLength: number = 50,
): Stream<(BcHistories & { from: number; to: number; }) | Error> {
    const initial = {
        from: 0,
        to: 0,
        items: [],
        totalCount: pageLength,
    };
    return Stream.generate(
        initial,
        (previous) => {
            if (previous instanceof Error) {
                return Promise.resolve(previous);
            }
            const from = previous.to;
            const to = Math.min(
                previous.to + pageLength,
                previous.totalCount
            );
            return lookupAddressHistories(
                socket,
                addresses,
                from,
                to,
                mempool,
                start,
                end
            ).then((result) => ({
                ...result,
                from,
                to,
            }), (error: mixed) => {
                if (typeof error === 'object' && error != null && error instanceof Error) {
                    return error;
                } else {
                    if (typeof error === 'string') {
                        return new Error(error);
                    } else {
                        return new Error(JSON.stringify(error));
                    }
                }
            });
        },
        (state: (BcHistories & { from: number; to: number; }) | Error) => {
            if (state instanceof Error) {
                return false;
            }
            return state.to < state.totalCount;
        }
    );
}

function lookupAddressHistories(
    socket: Socket,
    addresses: Array<string>,
    from: number,   // pagination from index (inclusive)
    to: number,     // pagination to index (not inclusive)
    mempool: boolean,
    start: number, // recent block height (inclusive)
    end: number    // older block height (inclusive)
): Promise<BcHistories> {
    const method = 'getAddressHistory';
    const rangeParam = mempool ? {
        start, // needed for older bitcores (so we don't load all history if bitcore-node < 3.1.3)
        end,
        queryMempoolOnly: true,
    } : {
        start,
        end,
        queryMempol: false,
    };
    const params = [
        addresses,
        {
            ...rangeParam,
            from,
            to,
        },
    ];
    return socket.send({ method, params });
}

// https://github.com/bitpay/bitcore-node/issues/423
function lookupDetailedTransaction(socket: Socket, hash: string): Promise<Object> {
    const method = 'getDetailedTransaction';
    const params = [
        hash,
    ];
    return socket.send({ method, params });
}

function sendTransaction(socket: Socket, hex: string): Promise<string> {
    const method = 'sendTransaction';
    const params = [
        hex,
    ];
    return socket.send({ method, params });
}

function lookupBlockHash(socket: Socket, height: number): Promise<string> {
    const method = 'getBlockHeader';
    const params = [height];
    return socket.send({method, params}).then(res => res.hash);
}

function lookupSyncStatus(socket: Socket): Promise<BcSyncStatus> {
    const method = 'getInfo';
    const params = [];
    return socket.send({method, params}).then(res => { return {height: res.blocks}; });
}

function onlineStatusCheck(socketWorkerFactory: SocketWorkerFactory, endpoint: string): Promise<?Socket> {
    const socket = new Socket(socketWorkerFactory, endpoint);
    const conn = new Promise((resolve) => {
        observeErrors(socket).awaitFirst().then(() => resolve(false)).catch(() => resolve(false));
        // we try to get the first block
        // if it returns something that looks like a blockhash, it probably works
        Promise.race([
            new Promise((resolve, reject) => setTimeout(() => reject(), 30000)),
            lookupBlockHash(socket, 0),
        ]).then(res => {
            if (res == null || res.length === 0) {
                resolve(false);
            } else {
                resolve(true);
            }
        }).catch(e => resolve(false));
    });
    return conn.then((res) => {
        if (!res) {
            socket.close();
            return null;
        }
        return socket;
    });
}

function observeErrors(socket: Socket): Stream<Error> {
    const errortypes = ['connect_error', 'reconnect_error', 'error', 'close', 'disconnect'];

    const s = Stream.combineFlat(errortypes.map(type =>
        socket.observe(type).map((k: mixed) => {
            if (k == null) {
                return new Error(type);
            }
            if (typeof k === 'object' && k instanceof Error) {
                return k;
            }
            if (typeof k === 'object') {
                if (typeof k.type === 'string') {
                    return new Error(k.type + ' ' + JSON.stringify(k));
                }
                return new Error(type + ' ' + JSON.stringify(k));
            }
            return new Error(k);
        })
    ));
    return s;
}
