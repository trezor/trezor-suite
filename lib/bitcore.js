/* @flow
 * Interface to bitcore-node blockchain backend
 */

import 'whatwg-fetch';

import { Stream } from './utils/stream';
import { Socket } from './socketio-worker/outside';
import { deferred } from './utils/deferred';
import { uniqueRandom } from './utils/unique-random';

import type { Deferred } from './utils/deferred';

export type SyncStatus = { height: number };

export type TransactionWithHeight = {
    hex: string,
    zcash: boolean,
    height: ?number,
    timestamp: ?number,
    hash: string,
    inputAddresses: Array<?string>,
    outputAddresses: Array<?string>,
    vsize: number,
    fee: number,
}

export type TxFees = {[blocks: number]: number};

export type Blockchain = {
    errors: Stream<Error>,
    notifications: Stream<TransactionWithHeight>,
    blocks: Stream<void>,

    workingUrl: string,

    subscribe(addresses: Set<string>): void,
    lookupTransactionsStream(
        addresses: Array<string>,
        start: number,
        end: number
    ): Stream<Array<TransactionWithHeight> | Error>,
    lookupTransactions(
        addresses: Array<string>,
        start: number,
        end: number
    ): Promise<Array<TransactionWithHeight>>,
    lookupTransaction(hash: string): Promise<TransactionWithHeight>,
    lookupBlockHash(height: number): Promise<string>,
    lookupSyncStatus(): Promise<SyncStatus>,
    sendTransaction(hex: string): Promise<string>,

    // this creates ANOTHER socket!
    // this is for repeated checks after one failure
    hardStatusCheck(): Promise<boolean>,

    estimateTxFees(blocks: Array<number>, skipMissing: boolean): Promise<TxFees>,
};

// Types beginning with Bc - bitcore format
type BcDetailedInput = {
    address: ?string,
    outputIndex: ?number,
    prevTxId: ?string, // coinbase
    satoshis: number,
    script: string,
    scriptAsm: ?string,
    sequence: number,
}

type BcDetailedOutput = {
    address: ?string,
    satoshis: number,
    script: string,
    scriptAsm: string,
}

type BcDetailedTransaction = {
    blockTimestamp: ?number, // undef on unconfirmed
    feeSatoshis: number,
    hash: string,
    height: number, // -1 on unconfirmed
    hex: string,
    inputSatoshis: number,
    inputs: Array<BcDetailedInput>,
    locktime: number,
    outputSatoshis: number,
    outputs: Array<BcDetailedOutput>,
    version: number,
    size: ?number, // if SatoshiLabs segwit fork of bitcore -> vsize; if original -> empty
}

type BcSyncStatus = { height: number };
type BcTransactionInfo = {
    tx: BcDetailedTransaction,
    confirmations: number, // 0 if no
    satoshis: number, // not sure what this means
};
type BcHistory = { addresses: { [address: string]: Object } } & BcTransactionInfo;
type BcHistories = { items: Array<BcHistory>, totalCount: number };

type SocketWorkerFactory = () => Worker;

export class BitcoreBlockchain {
    errors: Stream<Error>; // socket errors
    notifications: Stream<TransactionWithHeight>; // activity on subscribed addresses
    blocks: Stream<void>;

    addresses: Set<string>; // subscribed addresses
    socket: Deferred<Socket> = deferred();

    socketWorkerFactory: SocketWorkerFactory;
    endpoints: Array<string>;
    workingUrl: string = 'none';
    zcash: boolean;

    hasSmartTxFees: boolean; // does server support estimatesmartfee

    _silent: boolean = false; // don't show errors; on testing

    static _tryEndpoint(
        endpoints: Array<string>,
        socketWorkerFactory: SocketWorkerFactory,
        tried: {[k: string]: boolean}
    ): Promise<{socket: Socket, url: string}> {
        const untriedEndpoints = endpoints.filter((e, i) => !tried[i.toString()]);

        if (untriedEndpoints.length === 0) {
            return Promise.reject(new Error('All backends are down.'));
        }

        const random = uniqueRandom(untriedEndpoints.length);
        return onlineStatusCheck(socketWorkerFactory, untriedEndpoints[random]).then(socket => {
            if (socket) {
                return {socket, url: untriedEndpoints[random]};
            } else {
                tried[random.toString()] = true;
                return BitcoreBlockchain._tryEndpoint(endpoints, socketWorkerFactory, tried);
            }
        });
    }

    constructor(endpoints: Array<string>, socketWorkerFactory: SocketWorkerFactory) {
        this.addresses = new Set();

        this.socketWorkerFactory = socketWorkerFactory;
        this.endpoints = endpoints;
        this.zcash = false;

        const lookupTM = (socket: Socket): Stream<TransactionWithHeight> => {
            return socket.observe('bitcoind/addresstxid').mapPromise(
                ({txid}) =>
                    this.lookupTransaction(txid)
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
            const trySmartFee = estimateSmartTxFee(socket, 2, false).then(
                () => {
                    this.hasSmartTxFees = true;
                },
                () => {
                    this.hasSmartTxFees = false;
                }
            );
            trySmartFee.then(() => {
                this.workingUrl = url;
                this.socket.resolve(socket);
                errors.setter(observeErrors(socket));
                notifications.setter(lookupTM(socket));
                blocks.setter(observeBlocks(socket));
            });
        }, () => {
            errors.setter(Stream.simple(new Error('All backends are offline.')));
            if (!this._silent) {
                this.socket.reject(new Error('All backends are offline.'));
                this.socket.promise.catch((e) => console.error(e));
            }
        });
    }

    // this creates ANOTHER socket!
    // this is for repeated checks after one failure
    hardStatusCheck(): Promise<boolean> {
        return Promise.all(this.endpoints.map(endpoint => onlineStatusCheck(this.socketWorkerFactory, endpoint)))
        .then((statuschecks) => {
            statuschecks.forEach(s => {
                if (s != null) {
                    s.close();
                }
            });
            const on = statuschecks.filter(i => i != null);
            return on.length > 0;
        });
    }

    subscribe(inAddresses: Set<string>) {
        if (!(inAddresses instanceof Set)) {
            throw new Error('Input not a set of strings.');
        }
        for (const address of inAddresses) {
            if (typeof address !== 'string') {
                throw new Error('Input not a set of strings.');
            }
        }
        this.socket.promise.then(socket => {
            const newAddresses = [...inAddresses].filter((a) => !(this.addresses.has(a)));
            newAddresses.forEach(a => this.addresses.add(a));
            if (newAddresses.length !== 0) {
                for (let i = 0; i < newAddresses.length; i += 20) {
                    socket.subscribe('bitcoind/addresstxid', newAddresses.slice(i, i + 20));
                }
            }
        }, () => {});
    }

    destroy() {
        this.socket.promise.then(socket => {
            socket.close();
        });
    }

    // start/end are the block numbers, inclusive.
    // start is BIGGER than end
    // anti-intuitive, but the same as bitcore API
    lookupTransactionsStream(
        addresses: Array<string>,
        start: number,
        end: number
    ): Stream<Array<TransactionWithHeight> | Error> {
        const res = Stream.fromPromise(
            this.socket.promise.then(socket => {
                return lookupAllAddressHistories(
                    socket,
                    addresses,
                    start,
                    end
                ).map((r) => {
                    if (r instanceof Error) {
                        return r;
                    }
                    return r.items.map((item: BcTransactionInfo): TransactionWithHeight => convertTx(this.zcash, item.tx));
                });
            })
        );
        return res;
    }

    // start/end are the block numbers, inclusive.
    // start is BIGGER than end
    // anti-intuitive, but the same as bitcore API
    lookupTransactions(
        addresses: Array<string>,
        start: number,
        end: number
    ): Promise<Array<TransactionWithHeight>> {
        const maybeRes: Promise<Array<TransactionWithHeight> | Error> = this.lookupTransactionsStream(
            addresses,
            start,
            end
        ).reduce((
            previous: Array<TransactionWithHeight> | Error,
            current: Array<TransactionWithHeight> | Error
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

    lookupTransaction(hash: string): Promise<TransactionWithHeight> {
        return this.socket.promise.then(socket =>
            lookupDetailedTransaction(socket, hash)
                .then((info: BcDetailedTransaction): TransactionWithHeight => convertTx(this.zcash, info))
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

    estimateSmartTxFees(blocks: Array<number>, conservative: boolean): Promise<TxFees> {
        return this.socket.promise.then(socket => {
            if (!this.hasSmartTxFees) { // backup in the case of old node
                return this.estimateTxFees(blocks.map(b => Math.min(b, 25)), true);
            }
            let res: Promise<TxFees> = Promise.resolve({});
            blocks.forEach(block => {
                res = res.then((previous: TxFees): TxFees => {
                    return estimateSmartTxFee(socket, block, conservative).then(fee => {
                        const p = fee === -1
                            ? estimateTxFee(socket, Math.min(block, 25)) // when it's not loaded yet, just do backup
                            : Promise.resolve(fee);
                        return p.then((fee) => {
                            previous[block] = fee;
                            return previous;
                        });
                    });
                });
            });
            return res;
        });
    }

    estimateTxFees(blocks: Array<number>, skipMissing: boolean): Promise<TxFees> {
        return this.socket.promise.then(socket => {
            let res: Promise<TxFees> = Promise.resolve({});
            blocks.forEach(block => {
                res = res.then((previous: TxFees): TxFees => {
                    return estimateTxFee(socket, block).then(fee => {
                        const add = skipMissing ? fee !== -1 : true;
                        if (add) {
                            previous[block] = fee;
                        }
                        return previous;
                    });
                });
            });
            return res;
        });
    }
}

function lookupAllAddressHistories(
    socket: Socket,
    addresses: Array<string>,
    start: number,
    end: number
): Stream<(BcHistories & { from: number, to: number }) | Error> {
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
): Stream<(BcHistories & { from: number, to: number }) | Error> {
    const initial = {
        from: 0,
        to: 0,
        items: [],
        totalCount: 0,
    };

    function _flow_typehack<X>(x: X | Error): X {
        // $FlowIssue
        return x;
    }

    let pageLength = 1;
    let first = true;

    return Stream.generate(
        initial,
        (previous_) => {
            const previous = _flow_typehack(previous_);

            // increasing the page size * 5, but only if the txs are small enough
            // (some users like to have giant transactions,
            // which causes trouble on both network and memory)
            //
            // * 5 is quite aggressive, but in reality, the transactions are either
            // all normal, <500 B (so 5 transactions is probably even maybe too cautious),
            // or are all giant (> 20 kB) so taking by 1 is the best
            const previousTxLength = previous.items.reduce((total, history) => {
                return total + history.tx.hex.length / 2;
            }, 0);

            if (previousTxLength <= 5000 && !first) {
                pageLength = pageLength * 5;
                pageLength = Math.min(50, pageLength);
            }

            first = false;

            const from = previous.to;
            const to = previous.to + pageLength;

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
                    return new Error(JSON.stringify(error));
                }
            });
        },
        (state: (BcHistories & { from: number, to: number }) | Error) => {
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

function estimateSmartTxFee(socket: Socket, blocks: number, conservative: boolean): Promise<number> {
    const method = 'estimateSmartFee';
    const params = [blocks, conservative];
    return socket.send({method, params});
}

function estimateTxFee(socket: Socket, blocks: number): Promise<number> {
    const method = 'estimateFee';
    const params = [blocks];
    return socket.send({method, params});
}

function onlineStatusCheck(socketWorkerFactory: SocketWorkerFactory, endpoint: string): Promise<?Socket> {
    const socket = new Socket(socketWorkerFactory, endpoint);
    const conn = new Promise((resolve) => {
        observeErrors(socket).awaitFirst().then(() => resolve(false)).catch(() => resolve(false));
        // we try to get the first block
        // if it returns something, it probably works
        Promise.race([
            new Promise((resolve, reject) => setTimeout(() => reject(), 30000)),
            lookupBlockHash(socket, 0),
        ]).then(
            () => resolve(true),
            () => resolve(false)
        );
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
        socket.observe(type).map((k: mixed) =>
            new Error(`${JSON.stringify(k)} (${type})`)
        )
    ));
    return s;
}

function convertTx(zcash: boolean, bcTx: BcDetailedTransaction): TransactionWithHeight {
    return {
        zcash,
        hex: bcTx.hex,
        height: bcTx.height === -1 ? null : bcTx.height,
        timestamp: bcTx.blockTimestamp,
        hash: bcTx.hash,
        inputAddresses: bcTx.inputs.map(input => input.address),
        outputAddresses: bcTx.outputs.map(output => output.address),
        fee: bcTx.feeSatoshis,
        vsize: bcTx.size == null ? bcTx.hex.length / 2 : bcTx.size,
    };
}
