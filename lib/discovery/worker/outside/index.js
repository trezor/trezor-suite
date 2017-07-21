/* @flow */

import type {
    PromiseRequestType,
    StreamRequestType,
    ChunkDiscoveryInfo,
} from '../types';

import type {Network as BitcoinJsNetwork} from 'bitcoinjs-lib-zcash';

import { Emitter, Stream, StreamWithEnding } from '../../../utils/stream';
import type {Blockchain} from '../../../bitcore';
import type { AddressSource } from '../../../address-source';
import type { AccountInfo, AccountLoadStatus } from '../../index';

import {WorkerChannel} from './channel';

type WorkerFactory = () => Worker;

export class WorkerDiscoveryHandler {
    blockchain: Blockchain;
    addressSources: Array<?AddressSource>;
    workerChannel: WorkerChannel;
    network: BitcoinJsNetwork;

    constructor(f: WorkerFactory, blockchain: Blockchain, addressSources: Array<?AddressSource>, network: BitcoinJsNetwork) {
        this.blockchain = blockchain;
        this.addressSources = addressSources;

        this.workerChannel = new WorkerChannel(f, (r) => this.getPromise(r), (r) => this.getStream(r));
        this.network = network;
    }

    discovery(ai: ?AccountInfo, xpub: string, segwit: boolean): StreamWithEnding<AccountLoadStatus, AccountInfo> {
        // $FlowIssue
        const webassembly = typeof WebAssembly !== 'undefined';
        this.workerChannel.postToWorker({type: 'init', state: ai, network: this.network, webassembly, xpub, segwit});
        this.workerChannel.postToWorker({type: 'startDiscovery'});

        const promise = this.workerChannel.resPromise(() => this.counter.finisher.emit());

        const stream: Stream<AccountLoadStatus> = this.counter.stream;

        const res: StreamWithEnding<AccountLoadStatus, AccountInfo> = StreamWithEnding.fromStreamAndPromise(stream, promise);
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
                p.addresses
            );
        }
        return Stream.simple('Unknown request ' + p.type);
    }

    getPromise(p: PromiseRequestType): Promise<any> {
        if (p.type === 'lookupBlockHash') {
            return this.blockchain.lookupBlockHash(p.height);
        }
        if (p.type === 'lookupSyncStatus') {
            return this.blockchain.lookupSyncStatus().then(({height}) => height);
        }
        if (p.type === 'doesTransactionExist') {
            return this.blockchain.lookupTransaction(p.txid)
                .then(() => true, () => false);
        }
        return Promise.reject(new Error('Unknown request ' + p.type));
    }

    static deriveAddresses(
        source: ?AddressSource,
        addresses: ?Array<string>,
        firstIndex: number,
        lastIndex: number,
    ): Promise<Array<string>> {
        if (addresses == null) {
            if (source == null) {
                return Promise.reject(new Error("Cannot derive addresses in worker without webassembly"))
            } else {
                return source.derive(firstIndex, lastIndex);
            }
        } else {
            return Promise.resolve(addresses);
        }
    }

    getChunkStream(
        source: ?AddressSource,
        firstIndex: number,
        lastIndex: number,
        startBlock: number,
        endBlock: number,
        add: boolean,
        addresses: ?Array<string>
    ): Stream<ChunkDiscoveryInfo | string> {
        const addressPromise = WorkerDiscoveryHandler.deriveAddresses(source, addresses, firstIndex, lastIndex);

        return Stream.fromPromise(
            addressPromise.then(addresses => {
                return this.blockchain.lookupTransactionsStream(addresses, endBlock, startBlock)
                .map(
                    transactions => {
                        if (transactions instanceof Error) {
                            return transactions.message;
                        } else {
                            this.counter.setCount(this.counter.count + transactions.length);
                            const ci: ChunkDiscoveryInfo = {
                                transactions, addresses,
                            };
                            return ci;
                        }
                    }
                );
            })
        );
    }
}

class TransactionCounter {
    count: number = 0;
    emitter: Emitter<AccountLoadStatus> = new Emitter();
    finisher: Emitter<void> = new Emitter();
    stream: Stream<AccountLoadStatus> = Stream.fromEmitterFinish(this.emitter, this.finisher, () => { });
    setCount(i: number) {
        if (i > this.count) {
            this.count = i;
            this.emitter.emit({transactions: this.count});
        }
    }
}

