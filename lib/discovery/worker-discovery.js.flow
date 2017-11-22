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
        segwit: 'off' | 'p2sh'
    ): StreamWithEnding<AccountLoadStatus, AccountInfo> {
        const node = this.tryHDNode(xpub, network);
        if (node instanceof Error) {
            return StreamWithEnding.fromStreamAndPromise(Stream.fromArray([]), Promise.reject(node));
        }
        const external = node.derive(0);
        const internal = node.derive(1);

        const sources = [
            this.createAddressSource(external, network, segwit),
            this.createAddressSource(internal, network, segwit),
        ];

        const out = new WorkerDiscoveryHandler(
            this.discoveryWorkerFactory,
            this.chain,
            sources,
            network,
            this.forceAddedTransactions
        );
        return out.discovery(initial, xpub, segwit === 'p2sh');
    }

    monitorAccountActivity(
        initial: AccountInfo,
        xpub: string,
        network: BitcoinJsNetwork,
        segwit: 'off' | 'p2sh'
    ): Stream<AccountInfo | Error> {
        const node = this.tryHDNode(xpub, network);
        if (node instanceof Error) {
            return Stream.simple(node);
        }
        const external = node.derive(0);
        const internal = node.derive(1);

        const sources = [
            this.createAddressSource(external, network, segwit),
            this.createAddressSource(internal, network, segwit),
        ];

        function allAddresses(info: AccountInfo): Set<string> {
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

        const resNull: Stream<?(AccountInfo | Error)> = blockStream.concat(txNotifs).concat(this.forceAddedTransactionsStream).mapPromiseError(() => {
            const out = new WorkerDiscoveryHandler(
                this.discoveryWorkerFactory,
                this.chain,
                sources,
                network,
                this.forceAddedTransactions
            );
            return out.discovery(currentState, xpub, segwit === 'p2sh').ending.then(res => {
                currentState = res;
                return res;
            });
        });

        const res: Stream<AccountInfo | Error> = Stream.filterNull(resNull);
        return res;
    }

    createAddressSource(node: BitcoinJsHDNode, network: BitcoinJsNetwork, segwit: 'off' | 'p2sh'): ?WorkerAddressSource {
        const addressWorkerChannel = this.addressWorkerChannel;
        if (addressWorkerChannel == null) {
            return null;
        }
        const version = segwit === 'p2sh' ? network.scriptHash : network.pubKeyHash;
        return new WorkerAddressSource(addressWorkerChannel, node, version, segwit);
    }
}
