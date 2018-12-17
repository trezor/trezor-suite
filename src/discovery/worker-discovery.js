/* @flow */
import type {
    AccountInfo,
    AccountLoadStatus,
} from './index';
import { Emitter, Stream, StreamWithEnding } from '../utils/stream';

import {WorkerDiscoveryHandler} from './worker/outside';
import type {Network as BitcoinJsNetwork} from 'bitcoinjs-lib-zcash';
import {HDNode as BitcoinJsHDNode} from 'bitcoinjs-lib-zcash';

import {WorkerChannel as AddressWorkerChannel} from '../utils/simple-worker-channel';

import type {Blockchain, TransactionWithHeight} from '../bitcore';
import {WorkerAddressSource} from '../address-source';

import type {ForceAddedTransaction} from './index';

export class WorkerDiscovery {
    discoveryWorkerFactory: () => Worker;
    addressWorkerChannel: ?AddressWorkerChannel;
    chain: Blockchain;

    constructor(
        discoveryWorkerFactory: () => Worker,
        fastXpubWorker: Worker,
        fastXpubWasmPromise: Promise<ArrayBuffer>,
        chain: Blockchain,
    ) {
        this.discoveryWorkerFactory = discoveryWorkerFactory;
        // $FlowIssue
        this.addressWorkerChannel = (typeof WebAssembly === 'undefined') ? null : new AddressWorkerChannel(fastXpubWorker);
        fastXpubWasmPromise.then(
            binary => {
                if (this.addressWorkerChannel !== null) {
                    fastXpubWorker.postMessage({type: 'init', binary});
                }
            },
            error => console.error(error)
        );
        this.chain = chain;
    }

    tryHDNode(xpub: string, network: BitcoinJsNetwork): BitcoinJsHDNode | Error {
        try {
            const node = BitcoinJsHDNode.fromBase58(xpub, network, true);
            if (!node.isNeutered()) {
                throw new Error('XPRV entrered instead of XPUB. Exiting.');
            }
            return node;
        } catch (e) {
            return e;
        }
    }

    forceAddedTransactions: Array<ForceAddedTransaction> = [];
    forceAddedTransactionsEmitter: Emitter<boolean> = new Emitter();
    forceAddedTransactionsStream: Stream<'block' | TransactionWithHeight> = Stream.fromEmitter(this.forceAddedTransactionsEmitter, () => {}).map(() => 'block');

    // useful for adding transactions right after succesful send
    forceAddTransaction(
        transaction: ForceAddedTransaction
    ): void {
        this.forceAddedTransactions.push(transaction);
        this.forceAddedTransactionsEmitter.emit(true);
    }

    discoverAccount(
        initial: ?AccountInfo,
        xpub: string,
        network: BitcoinJsNetwork,
        segwit: 'off' | 'p2sh',
        cashAddress: boolean,
        gap: number,

        // what (new Date().getTimezoneOffset()) returns
        // note that it is NEGATIVE from the UTC string timezone
        // so, UTC+2 timezone returns -120...
        // it's javascript, it's insane by default
        timeOffset: number,
    ): StreamWithEnding<AccountLoadStatus, AccountInfo> {
        const node = this.tryHDNode(xpub, network);
        if (node instanceof Error) {
            return StreamWithEnding.fromStreamAndPromise(Stream.empty(), Promise.reject(node));
        }

        return StreamWithEnding.fromPromise(
            Promise.all([this.deriveXpub(xpub, network, 0), this.deriveXpub(xpub, network, 1)]).then(([externalXpub, internalXpub]) => {
                const internal = BitcoinJsHDNode.fromBase58(internalXpub, network, true);
                const external = BitcoinJsHDNode.fromBase58(externalXpub, network, true);

                const sources = [
                    this.createWorkerAddressSource(external, network, segwit),
                    this.createWorkerAddressSource(internal, network, segwit),
                ];

                const out = new WorkerDiscoveryHandler(
                    this.discoveryWorkerFactory,
                    this.chain,
                    sources,
                    network,
                    cashAddress || false,
                    this.forceAddedTransactions
                );
                return out.discovery(initial, xpub, segwit === 'p2sh', gap, timeOffset);
            })
        );
    }

    monitorAccountActivity(
        initial: ?AccountInfo,
        xpub: string,
        network: BitcoinJsNetwork,
        segwit: 'off' | 'p2sh',
        cashAddress: boolean,
        gap: number,

        // what (new Date().getTimezoneOffset()) returns
        // note that it is NEGATIVE from the UTC string timezone
        // so, UTC+2 timezone returns -120...
        // it's javascript, it's insane by default
        timeOffset: number,
    ): Stream<AccountInfo | Error> {
        const node = this.tryHDNode(xpub, network);
        if (node instanceof Error) {
            return Stream.simple(node);
        }
        return Stream.fromPromise(
            Promise.all([this.deriveXpub(xpub, network, 0), this.deriveXpub(xpub, network, 1)]).then(([externalXpub, internalXpub]) => {
                const internal = BitcoinJsHDNode.fromBase58(internalXpub, network, true);
                const external = BitcoinJsHDNode.fromBase58(externalXpub, network, true);

                const sources = [
                    this.createWorkerAddressSource(external, network, segwit),
                    this.createWorkerAddressSource(internal, network, segwit),
                ];

                function allAddresses(info: ?AccountInfo): Set<string> {
                    if (info == null) {
                        return new Set([]);
                    }
                    return new Set(
                        info.usedAddresses.map(a => a.address)
                        .concat(info.unusedAddresses)
                        .concat(info.changeAddresses)
                    );
                }

                this.chain.subscribe(allAddresses(initial));
                let currentState = initial;

                const txNotifs: Stream<'block' | TransactionWithHeight> = this.chain.notifications.filter(tx => {
                    // determine if it's mine
                    const addresses = allAddresses(currentState);
                    let mine = false;
                    tx.inputAddresses.concat(tx.outputAddresses).forEach(a => {
                        if (a != null) {
                            if (addresses.has(a)) {
                                mine = true;
                            }
                        }
                    });
                    return mine;
                })
                // flow thing
                .map((tx: TransactionWithHeight): ('block' | TransactionWithHeight) => tx);

                // we need to do updates on blocks, if there are unconfs
                const blockStream: Stream<'block' | TransactionWithHeight> = this.chain.blocks.map(() => 'block');
                const reloads: Stream<'block' | TransactionWithHeight> = Stream.combineFlat([
                    blockStream,
                    txNotifs,
                    this.forceAddedTransactionsStream,
                ]);

                const res: Stream<(AccountInfo | Error)> = reloads.mapPromise((): Promise<AccountInfo> => {
                    const out: WorkerDiscoveryHandler = new WorkerDiscoveryHandler(
                        this.discoveryWorkerFactory,
                        this.chain,
                        sources,
                        network,
                        cashAddress || false,
                        this.forceAddedTransactions
                    );
                    const discovery: StreamWithEnding<AccountLoadStatus, AccountInfo> = out.discovery(currentState, xpub, segwit === 'p2sh', gap, timeOffset);

                    const ending: Promise<AccountInfo> = discovery.ending;
                    const res: Promise<AccountInfo> = ending.then(res => {
                        currentState = res;
                        return res;
                    });
                    return res;
                });

                return res;
            })
        );
    }

    createWorkerAddressSource(node: BitcoinJsHDNode, network: BitcoinJsNetwork, segwit: 'off' | 'p2sh'): ?WorkerAddressSource {
        const addressWorkerChannel = this.addressWorkerChannel;
        if (addressWorkerChannel == null) {
            return null;
        }
        const version = segwit === 'p2sh' ? network.scriptHash : network.pubKeyHash;
        return new WorkerAddressSource(addressWorkerChannel, node, version, segwit);
    }

    deriveXpub(
        xpub: string,
        network: BitcoinJsNetwork,
        index: number
    ): Promise<string> {
        const addressWorkerChannel = this.addressWorkerChannel;
        if (addressWorkerChannel == null) {
            return Promise.resolve(BitcoinJsHDNode.fromBase58(xpub, network, true).derive(index).toBase58());
        } else {
            return addressWorkerChannel.postMessage({
                type: 'deriveNode',
                xpub: xpub,
                version: network.bip32.public,
                index: index,
            }).then(x => x.xpub);
        }
    }
}
