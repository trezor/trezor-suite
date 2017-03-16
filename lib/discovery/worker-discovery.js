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

import type {Blockchain} from '../bitcore';
import { CachingAddressSource, WorkerAddressSource, PrefatchingSource } from '../address-source';

export class WorkerDiscovery {
    discoveryWorkerFactory: () => Worker;
    addressWorkerChannel: AddressWorkerChannel;
    chain: Blockchain;

    constructor(
        discoveryWorkerFactory: () => Worker,
        addressWorkerChannel: AddressWorkerChannel,
        chain: Blockchain,
    ) {
        this.discoveryWorkerFactory = discoveryWorkerFactory;
        this.addressWorkerChannel = addressWorkerChannel;
        this.chain = chain;
    }

    discoverAccount(
        initial: ?AccountInfo,
        // source: Array<AddressSource>
        xpub: string,
        network: BitcoinJsNetwork,
    ): StreamWithEnding<AccountLoadStatus, AccountInfo> {
        const node = BitcoinJsHDNode.fromBase58(xpub, network);
        const external = node.derive(0);
        const internal = node.derive(1);

        const sources = [
            this.createAddressSource(external, network),
            this.createAddressSource(internal, network),
        ];

        const out = new WorkerDiscoveryHandler(
            this.discoveryWorkerFactory,
            this.chain,
            sources
        );
        return out.discovery(initial);
    }

    monitorAccountActivity(
        initial: AccountInfo,
        xpub: string,
        network: BitcoinJsNetwork,
    ): Stream<AccountInfo | Error> {
        const node = BitcoinJsHDNode.fromBase58(xpub, network);
        const external = node.derive(0);
        const internal = node.derive(1);

        const sources = [
            this.createAddressSource(external, network),
            this.createAddressSource(internal, network),
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
        
        const notifStream: Stream<?(AccountInfo | Error)> = this.chain.notifications.mapPromiseError(tx => {
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
            if (mine) {
                const out = new WorkerDiscoveryHandler(
                    this.discoveryWorkerFactory,
                    this.chain,
                    sources
                );
                return out.discovery(currentState).ending.then(res => {
                    currentState = res;
                    return res;
                });
            } else {
                return Promise.resolve(null);
            }
        });
        const blockStream: Stream<?(AccountInfo | Error)> = this.chain.blocks.mapPromiseError(() => {
            const unconfirmed = currentState.transactions.filter(t => t.height == null);
            if (unconfirmed.length > 0) {
                const out = new WorkerDiscoveryHandler(
                    this.discoveryWorkerFactory,
                    this.chain,
                    sources
                );
                return out.discovery(currentState).ending.then(res => {
                    currentState = res;
                    return res;
                });
            } else {
                return Promise.resolve(null);
            }
        });
        const res: Stream<AccountInfo | Error> = Stream.filterNull(notifStream.concat(blockStream));
        return res;
    }

    createAddressSource(node: BitcoinJsHDNode, network: BitcoinJsNetwork): CachingAddressSource {
        let source;
        source = new WorkerAddressSource(this.addressWorkerChannel, node, network.pubKeyHash);
        source = new PrefatchingSource(source);
        source = new CachingAddressSource(source);
        return source;
    }
}
