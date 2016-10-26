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

    explorerUrl: string;

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

export class BitcoreBlockchain {
    errors: Stream<Error>; // socket errors
    reconnections: Stream<void>; // socket reconnections
    notifications: Stream<TransactionMatch>; // activity on subscribed addresses
    blocks: Stream<void>;

    addresses: ImmutableSet<string>; // subscribed addresses
    socket: Deferred<Socket> = deferred();

    socketWorkerFactory: SocketWorkerFactory;
    endpoints: Array<string>;

    explorerUrl: string;

    static _tryEndpoint(
        endpoints: Array<string>,
        socketWorkerFactory: SocketWorkerFactory,
        tried: {[k: string]: boolean}
    ): Promise<string> {
        if (Object.keys(tried).length === endpoints.length + 1) {
            return Promise.reject(new Error('All backends are down.'));
        }
        let random = -1;
        while (tried[random.toString()]) {
            random = Math.floor(Math.random() * endpoints.length);
        }
        return onlineStatusCheck(socketWorkerFactory, endpoints[random]).then(status => {
            if (status) {
                return endpoints[random];
            } else {
                tried[random.toString()] = true;
                return BitcoreBlockchain._tryEndpoint(endpoints, socketWorkerFactory, tried);
            }
        });
    }

    constructor(endpoints: Array<string>, socketWorkerFactory: SocketWorkerFactory) {
        this.addresses = new ImmutableSet();

        this.socketWorkerFactory = socketWorkerFactory;
        this.endpoints = endpoints;

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

        this.explorerUrl = this.endpoints[0];

        const errors = Stream.setLater();
        const notifications = Stream.setLater();
        const blocks = Stream.setLater();
        this.errors = errors.stream;
        this.notifications = notifications.stream;
        this.blocks = blocks.stream;

        const tried = {'-1': true};
        BitcoreBlockchain._tryEndpoint(endpoints, socketWorkerFactory, tried).then(endpoint => {
            this.explorerUrl = endpoint;
            const socket = new Socket(socketWorkerFactory, endpoint);
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
            const on = statuschecks.filter(i => i);
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
        start: ?number = null,
        end: ?number = null
    ): Stream<Array<TransactionMatch>> {
        return Stream.fromPromise(
            this.socket.promise.then(socket => {
                return lookupAllAddressHistories(
                    socket,
                    addresses,
                    start,
                    end
                ).map((r) => r.items.map((item) => historyToMatch(item)));
            })
        );
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
        return this.socket.promise.then(socket =>
            lookupDetailedTransaction(socket, hash)
                .then((info) => detailedToInfo(info, false))
        );
    }

    lookupTransactionAsMatch(hash: string): Promise<TransactionMatch> {
        return this.socket.promise.then(socket =>
            lookupDetailedTransaction(socket, hash)
                .then((info) => detailedToTransactionMatch(info, true))
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

function historyToMatch(r: BcHistory): TransactionMatch {
    return {
        info: detailedToInfo(r.tx, true),
        addresses: Object.keys(r.addresses),
    };
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
        addresses,
    };
}

const EMPTY_BUFFER = new Buffer(0);

function bitcoreToTransaction(r: BcDetailedTransaction, neutered: boolean = true): Transaction {
    const tx = Transaction.fromHex(r.hex);

    if (neutered) {
        tx.ins.forEach(input => {
            input.script = EMPTY_BUFFER;
        });
        if (tx.joinsplits != null) {
            tx.joinsplits = tx.joinsplits.map(js => ({
                vpubNew: js.vpubNew,
                vpubOld: js.vpubOld,
            }));
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
    const initial = {
        from: 0,
        to: 0,
        items: [],
        totalCount: pageLength,
    };
    return Stream.generate(
        initial,
        (previous) => {
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
    const method = 'getAddressHistory';
    const params = [
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

function onlineStatusCheck(socketWorkerFactory: SocketWorkerFactory, endpoint: string): Promise<boolean> {
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
    conn.then((res) => {
        socket.close();
    });
    return conn;
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

