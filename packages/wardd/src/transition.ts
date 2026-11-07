import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js';

import { EMPTY_ROOT_HEX } from '@trezor/ward';

export { EMPTY_ROOT_HEX } from '@trezor/ward';
export const normalizeRoot = (root?: string): string =>
    root === EMPTY_ROOT_HEX ? '' : (root ?? '');
export const genesisNonce = (wardId: string): string =>
    bytesToHex(
        sha256(concatBytes(new TextEncoder().encode('WARD GENESIS v2'), hexToBytes(wardId))),
    );
export type SignedTransition = {
    wardId: string;
    fromCounter: number;
    fromRoot: string;
    counter: number;
    root: string;
    mac: string;
    authCommit: string;
    signature: string;
    kind: 'commit' | 'revert';
    headNonce: string;
};

export const transitionMessage = (record: SignedTransition): Uint8Array => {
    const counter = (value: number) => {
        if (!Number.isInteger(value) || value < 0 || value > 0xffffffff)
            throw new Error('invalid transition counter');
        const bytes = new Uint8Array(4);
        new DataView(bytes.buffer).setUint32(0, value);

        return bytes;
    };
    const word = (hex: string): Uint8Array => {
        const bytes = hexToBytes(hex);
        if (bytes.length !== 32) throw new Error('invalid transition word');

        return bytes;
    };
    if (record.kind !== 'commit' && record.kind !== 'revert')
        throw new Error('invalid transition kind');
    if (record.counter !== record.fromCounter + 1)
        throw new Error('transition must advance exactly once');

    return concatBytes(
        new TextEncoder().encode('WARD WM TRANSITION v2'),
        Uint8Array.of(record.kind === 'revert' ? 1 : 0),
        word(record.wardId),
        counter(record.fromCounter),
        word(record.fromRoot || EMPTY_ROOT_HEX),
        counter(record.counter),
        word(record.root || EMPTY_ROOT_HEX),
        word(record.mac),
        word(record.authCommit),
        word(record.headNonce),
    );
};

export const verifyTransition = (record: SignedTransition): void => {
    if (
        !record.mac ||
        record.mac === '00'.repeat(32) ||
        !ed25519.verify(
            hexToBytes(record.signature),
            transitionMessage(record),
            hexToBytes(record.wardId),
        )
    )
        throw new Error('invalid wallet transition signature');
};
