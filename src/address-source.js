/* @flow
 * Derivation of addresses from HD nodes
 */

import type { HDNode } from 'bitcoinjs-lib-zcash';
import type { Network } from 'bitcoinjs-lib-zcash';
import type { WorkerChannel } from './utils/simple-worker-channel';
import {
    crypto,
    address,
} from 'bitcoinjs-lib-zcash';

export type AddressSource = {
    derive(
        firstIndex: number,
        lastIndex: number
    ): Promise<Array<string>>,
};

export class BrowserAddressSource {
    network: Network;

    segwit: boolean;
    node: HDNode;

    constructor(hdnode: HDNode, network: Network, segwit: boolean) {
        this.network = network;
        this.segwit = segwit;
        this.node = hdnode;
    }

    derive(
        first: number,
        last: number
    ): Promise<Array<string>> {
        const addresses: Array<string> = [];
        // const chainNode = HDNode.fromBase58(this.xpub, this.network).derive(this.chainId);
        for (let i = first; i <= last; i++) {
            const addressNode = this.node.derive(i);
            let naddress = '';

            if (!this.segwit) {
                naddress = addressNode.getAddress();
            } else {
                // see https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki
                // address derivation + test vectors
                const pkh = addressNode.getIdentifier();
                const scriptSig = new Buffer(pkh.length + 2);
                scriptSig[0] = 0;
                scriptSig[1] = 0x14;
                pkh.copy(scriptSig, 2);
                const addressBytes = crypto.hash160(scriptSig);
                naddress = address.toBase58Check(addressBytes, this.network.scriptHash);
            }
            addresses.push(naddress);
        }
        return Promise.resolve(addresses);
    }
}

export class WorkerAddressSource {
    channel: WorkerChannel;
    node: {
        depth: number,
        child_num: number,
        fingerprint: number,
        chain_code: $ReadOnlyArray<number>,
        public_key: $ReadOnlyArray<number>,
    };
    version: number;
    segwit: 'p2sh' | 'off';

    constructor(channel: WorkerChannel, node: HDNode, version: number, segwit: 'p2sh' | 'off') {
        this.channel = channel;
        this.node = {
            depth: node.depth,
            child_num: node.index,
            fingerprint: node.parentFingerprint,
            chain_code: Array.prototype.slice.call(node.chainCode),
            public_key: Array.prototype.slice.call(node.keyPair.getPublicKeyBuffer()),
        };
        this.version = version;
        this.segwit = segwit;
    }

    derive(firstIndex: number, lastIndex: number): Promise<Array<string>> {
        const request = {
            type: 'deriveAddressRange',
            node: this.node,
            version: this.version,
            firstIndex,
            lastIndex,
            addressFormat: this.segwit === 'p2sh' ? 1 : 0,
        };
        return this.channel.postMessage(request)
            .then(({addresses}) => addresses);
    }
}
