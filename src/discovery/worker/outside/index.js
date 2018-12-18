/* @flow */

import type { Network as BitcoinJsNetwork } from 'bitcoinjs-lib-zcash';
import bchaddrjs from 'bchaddrjs';
import type {
    PromiseRequestType,
    StreamRequestType,
    ChunkDiscoveryInfo,
} from '../types';


import { Emitter, Stream, StreamWithEnding } from '../../../utils/stream';
import type { Blockchain, TransactionWithHeight } from '../../../bitcore';
import type { AddressSource } from '../../../address-source';
import type { AccountInfo, AccountLoadStatus, ForceAddedTransaction } from '../../index';

import { WorkerChannel } from './channel';

// eslint-disable-next-line no-undef
type WorkerFactory = () => Worker;

export class WorkerDiscoveryHandler {
    blockchain: Blockchain;

    addressSources: Array<?AddressSource>;

    workerChannel: WorkerChannel;

    network: BitcoinJsNetwork;

    cashAddress: boolean;

    // this array is the SAME object as in the WorkerDiscovery object
    // it will be changed here - this is intentional
    // we want to delete from this array if we actually see the tx in the wild
    forceAddedTransactions: Array<ForceAddedTransaction> = [];

    constructor(
        f: WorkerFactory,
        blockchain: Blockchain,
        addressSources: Array<?AddressSource>,
        network: BitcoinJsNetwork,
        cashAddress: boolean,
        forceAddedTransactions: Array<ForceAddedTransaction>,
    ) {
        this.blockchain = blockchain;
        this.addressSources = addressSources;

        this.workerChannel = new WorkerChannel(f, r => this.getPromise(r), r => this.getStream(r));
        this.network = network;
        this.cashAddress = cashAddress;
        this.forceAddedTransactions = forceAddedTransactions;
    }

    discovery(
        ai: ?AccountInfo,
        xpub: string,
        segwit: boolean,
        gap: number,

        // what (new Date().getTimezoneOffset()) returns
        // note that it is NEGATIVE from the UTC string timezone
        // so, UTC+2 timezone returns -120...
        // it's javascript, it's insane by default
        timeOffset: number,
    ): StreamWithEnding<AccountLoadStatus, AccountInfo> {
        // $FlowIssue
        const webassembly = typeof WebAssembly !== 'undefined';
        this.workerChannel.postToWorker({
            type: 'init',
            state: ai,
            network: this.network,
            webassembly,
            xpub,
            segwit,
            cashAddress: this.cashAddress,
            gap,
            timeOffset,
        });
        this.workerChannel.postToWorker({ type: 'startDiscovery' });

        const promise = this.workerChannel.resPromise(() => {
            this.counter.finisher.emit();
            this.counter.stream.dispose();
        });

        const res: StreamWithEnding<AccountLoadStatus, AccountInfo> = StreamWithEnding
            .fromStreamAndPromise(
                this.counter.stream,
                promise,
            );
        return res;
    }

    counter = new TransactionCounter();

    getStream(p: StreamRequestType): Stream<any> {
        if (p.type === 'chunkTransactions') {
            const source = this.addressSources[p.chainId];
            if (p.chainId === 0) {
                this.counter.setCount(p.pseudoCount);
            }
            return this.getChunkStream(
                source,
                p.firstIndex,
                p.lastIndex,
                p.startBlock,
                p.endBlock,
                p.chainId === 0,
                p.addresses,
            );
        }
        return Stream.simple(`Unknown request ${p.type}`);
    }

    getPromise(p: PromiseRequestType): Promise<any> {
        if (p.type === 'lookupBlockHash') {
            return this.blockchain.lookupBlockHash(p.height);
        }
        if (p.type === 'lookupSyncStatus') {
            return this.blockchain.lookupSyncStatus().then(({ height }) => height);
        }
        if (p.type === 'doesTransactionExist') {
            return this.blockchain.lookupTransaction(p.txid)
                .then(() => true, () => false);
        }
        return Promise.reject(new Error(`Unknown request ${p.type}`));
    }

    static deriveAddresses(
        source: ?AddressSource,
        addresses: ?Array<string>,
        firstIndex: number,
        lastIndex: number,
    ): Promise<Array<string>> {
        if (addresses == null) {
            if (source == null) {
                return Promise.reject(new Error('Cannot derive addresses in worker without webassembly'));
            }
            return source.derive(firstIndex, lastIndex);
        }
        return Promise.resolve(addresses);
    }

    getChunkStream(
        source: ?AddressSource,
        firstIndex: number,
        lastIndex: number,
        startBlock: number,
        endBlock: number,
        add: boolean,
        oaddresses: ?Array<string>,
    ): Stream<ChunkDiscoveryInfo | string> {
        const addressPromise = WorkerDiscoveryHandler.deriveAddresses(
            source,
            oaddresses,
            firstIndex,
            lastIndex,
        );

        const errStream: Stream<ChunkDiscoveryInfo | string | Error> = Stream.fromPromise(
            addressPromise.then((paddresses) => {
                const addresses = this.cashAddress
                    ? paddresses.map(a => bchaddrjs.toCashAddress(a))
                    : paddresses;

                return this.blockchain.lookupTransactionsStream(addresses, endBlock, startBlock)
                    .map(
                        (transactions) => {
                            if (transactions instanceof Error) {
                                return transactions.message;
                            }
                            const transactions_: Array<TransactionWithHeight> = transactions;

                            // code for handling forceAdded transactions
                            const addedTransactions = [];
                            this.forceAddedTransactions.slice().forEach((transaction, i) => {
                                const transaction_: TransactionWithHeight = {
                                    ...transaction,
                                    height: null,
                                    timestamp: null,
                                };
                                if (transactions_
                                    .map(t => t.hash)
                                    .some(hash => transaction.hash === hash)) {
                                    // transaction already came from blockchain again
                                    this.forceAddedTransactions.splice(i, 1);
                                } else {
                                    const txAddresses = new Set();
                                    transaction
                                        .inputAddresses
                                        .concat(transaction.outputAddresses)
                                        .forEach((a) => {
                                            if (a != null) {
                                                txAddresses.add(a);
                                            }
                                        });
                                    if (addresses.some(address => txAddresses.has(address))) {
                                        addedTransactions.push(transaction_);
                                    }
                                }
                            });

                            this.counter.setCount(this.counter.count + transactions.length);

                            const ci: ChunkDiscoveryInfo = {
                                transactions: transactions.concat(addedTransactions), addresses,
                            };
                            return ci;
                        },
                    );
            }),
        );
        const resStream: Stream<ChunkDiscoveryInfo | string> = errStream
            .map(
                (k: (ChunkDiscoveryInfo | string | Error)): (ChunkDiscoveryInfo | string) => {
                    if (k instanceof Error) {
                        return k.message;
                    }
                    return k;
                },
            );
        return resStream;
    }
}

class TransactionCounter {
    count: number = 0;

    emitter: Emitter<AccountLoadStatus> = new Emitter();

    finisher: Emitter<void> = new Emitter();

    stream: Stream<AccountLoadStatus> = Stream
        .fromEmitterFinish(
            this.emitter,
            this.finisher,
            () => { },
        );

    setCount(i: number) {
        if (i > this.count) {
            this.count = i;
            this.emitter.emit({ transactions: this.count });
        }
    }
}
