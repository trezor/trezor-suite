/* @flow */
import type {
    AccountInfo,
    AccountLoadStatus,
} from './index';
import { Stream, StreamWithEnding } from '../utils/stream';

import {WorkerDiscoveryHandler} from './worker/outside';
import type {Network as BitcoinJsNetwork} from 'bitcoinjs-lib-zcash';
import {HDNode as BitcoinJsHDNode} from 'bitcoinjs-lib-zcash';

import type {WorkerChannel as AddressWorkerChannel} from '../utils/simple-worker-channel';

import type {Blockchain, TransactionWithHeight} from '../bitcore';
import {WorkerAddressSource} from '../address-source';

export class WorkerDiscovery {
    discoveryWorkerFactory: () => Worker;
    addressWorkerChannel: ?AddressWorkerChannel;
    chain: Blockchain;

    constructor(
        discoveryWorkerFactory: () => Worker,
        addressWorkerChannel: AddressWorkerChannel,
        chain: Blockchain,
    ) {
        this.discoveryWorkerFactory = discoveryWorkerFactory;
        // $FlowIssue
        this.addressWorkerChannel = (typeof WebAssembly === 'undefined') ? null : addressWorkerChannel;
        this.chain = chain;
    }

    tryHDNode(xpub: string, network: BitcoinJsNetwork): BitcoinJsHDNode | Error {
        try {
            const node = BitcoinJsHDNode.fromBase58(xpub, network);
            return node;
        } catch (e) {
            return e;
        }
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
            network
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

        const resNull: Stream<?(AccountInfo | Error)> = blockStream.concat(txNotifs).mapPromiseError(tx => {
            let doIt = false;
            if (tx === 'block') {
                const unconfirmed = currentState.transactions.filter(t => t.height == null);
                doIt = unconfirmed.length > 0;
            } else {
                doIt = true;
            }
            if (doIt) {
                const out = new WorkerDiscoveryHandler(
                    this.discoveryWorkerFactory,
                    this.chain,
                    sources,
                    network
                );
                return out.discovery(currentState, xpub, segwit === 'p2sh').ending.then(res => {
                    currentState = res;
                    return res;
                });
            } else {
                return Promise.resolve(null);
            }
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
