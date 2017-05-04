/* @flow
 * Derivation of addresses from HD nodes
 */

import type { HDNode } from 'bitcoinjs-lib-zcash';
import type { WorkerChannel } from './utils/simple-worker-channel';

export type AddressSource = {
    derive(
        firstIndex: number,
        lastIndex: number
    ): Promise<Array<string>>,
};

export class WorkerAddressSource {
    channel: WorkerChannel;
    node: {
        depth: number,
        child_num: number,
        fingerprint: number,
        chain_code: Buffer,
        public_key: Buffer,
    };
    version: number;
    segwit: 'p2sh' | 'off';

    constructor(channel: WorkerChannel, node: HDNode, version: number, segwit: 'p2sh' | 'off') {
        this.channel = channel;
        this.node = {
            depth: node.depth,
            child_num: node.index,
            fingerprint: node.parentFingerprint,
            chain_code: node.chainCode,
            public_key: node.keyPair.getPublicKeyBuffer(),
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
            segwit: this.segwit === 'p2sh',
        };
        return this.channel.postMessage(request)
            .then(({addresses}) => addresses);
    }
}
