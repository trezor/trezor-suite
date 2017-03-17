/* @flow */

import type {
    PromiseRequestType,
    StreamRequestType,
    ChunkDiscoveryInfo,
} from '../types';

import { Emitter, Stream, StreamWithEnding } from '../../../utils/stream';
import type {Blockchain} from '../../../bitcore';
import type { AddressSource } from '../../../address-source';
import type { AccountInfo, AccountLoadStatus } from '../../index';

import {WorkerChannel} from './channel';

type WorkerFactory = () => Worker;

export class WorkerDiscoveryHandler {
    blockchain: Blockchain;
    addressSources: Array<AddressSource>;
    workerChannel: WorkerChannel;

    constructor(f: WorkerFactory, blockchain: Blockchain, addressSources: Array<AddressSource>) {
        this.blockchain = blockchain;
        this.addressSources = addressSources;

        this.workerChannel = new WorkerChannel(f, (r) => this.getPromise(r), (r) => this.getStream(r));
    }

    discovery(ai: ?AccountInfo): StreamWithEnding<AccountLoadStatus, AccountInfo> {
        this.workerChannel.postToWorker({type: 'init', state: ai});
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
                p.chainId === 0
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

    getChunkStream(
        source: AddressSource,
        firstIndex: number,
        lastIndex: number,
        startBlock: number,
        endBlock: number,
        add: boolean
    ): Stream<ChunkDiscoveryInfo | string> {
        return Stream.fromPromise(
            source.derive(firstIndex, lastIndex).then(addresses => {
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
    disposed: boolean = false;
    count: number = 0;
    emitter: Emitter<AccountLoadStatus> = new Emitter();
    finisher: Emitter<void> = new Emitter();
    stream: Stream<AccountLoadStatus> = Stream.fromEmitterFinish(this.emitter, this.finisher, () => { this.disposed = true; });
    setCount(i: number) {
        this.count = i;
        if (!this.disposed) {
            this.emitter.emit({transactions: this.count});
        }
    }
}

