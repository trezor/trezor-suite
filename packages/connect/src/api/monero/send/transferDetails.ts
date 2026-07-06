// Build the MoneroTransferDetails the device needs to export a key image for each spent output. This
// is the wire shape moneroKeyImageSync consumes: hex fields decoded to bytes, indices passed through.
// Pure, so it is unit-testable.
import { hexToBytes } from '@noble/hashes/utils.js';

import type { KeyImageInput } from '../tx/sendMoneroTransaction';

export interface MoneroTransferDetailsWire {
    out_key: Uint8Array;
    tx_pub_key: Uint8Array;
    additional_tx_pub_keys: Uint8Array[];
    internal_output_index: number;
    sub_addr_major: number;
    sub_addr_minor: number;
}

const KEY_HEX_LENGTH = 64; // 32-byte Monero public key

const decodeKey = (hex: string, label: string): Uint8Array => {
    if (hex.length !== KEY_HEX_LENGTH) {
        throw new Error(
            `transferDetails: ${label} must be ${KEY_HEX_LENGTH} hex chars, got ${hex.length}`,
        );
    }

    return hexToBytes(hex);
};

export const buildTransferDetails = (inputs: KeyImageInput[]): MoneroTransferDetailsWire[] =>
    inputs.map(input => ({
        out_key: decodeKey(input.outKey, 'out_key'),
        tx_pub_key: decodeKey(input.txPubKey, 'tx_pub_key'),
        additional_tx_pub_keys: input.additionalTxPubKeys.map(key =>
            decodeKey(key, 'additional_tx_pub_key'),
        ),
        internal_output_index: input.internalOutputIndex,
        sub_addr_major: input.subAddrMajor,
        sub_addr_minor: input.subAddrMinor,
    }));
