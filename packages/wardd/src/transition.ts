import { ed25519 } from '@noble/curves/ed25519.js';
import { concatBytes, hexToBytes } from '@noble/hashes/utils.js';

import { EMPTY_ROOT_HEX } from '@trezor/ward';

export { EMPTY_ROOT_HEX } from '@trezor/ward';
export const normalizeRoot = (root?: string): string =>
    root === EMPTY_ROOT_HEX ? '' : (root ?? '');
/**
 * One wallet-signed WM transition, as the WM's JSON API carries it. Roots use '' for the empty
 * tree; the signed bytes use the canonical empty digest (see `transitionMessage`).
 */
export type SignedTransition = {
    wardId: string;
    kind: 'commit' | 'revert';
    fromCounter: number;
    fromRoot: string;
    counter: number;
    root: string;
    mac: string;
    authCommit: string;
    signature: string;
};

/**
 * kind (0x00 commit, 0x01 revert) || wardId || fromCounter:u32 || fromRoot || counter:u32
 *     || root || mac || authCommit
 *
 * The transition fields both the wallet and the WM sign, under different domains.
 */
const transitionBody = (record: SignedTransition): Uint8Array => {
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
        Uint8Array.of(record.kind === 'revert' ? 1 : 0),
        word(record.wardId),
        counter(record.fromCounter),
        word(record.fromRoot || EMPTY_ROOT_HEX),
        counter(record.counter),
        word(record.root || EMPTY_ROOT_HEX),
        word(record.mac),
        word(record.authCommit),
    );
};

/** "WARD WM TRANSITION v1" || body: the wallet's authorization of the transition. */
export const transitionMessage = (record: SignedTransition): Uint8Array =>
    concatBytes(new TextEncoder().encode('WARD WM TRANSITION v1'), transitionBody(record));

/** "WARD FINAL v1" || body || timestamp:u64: the WM's signature over what it accepted, and when. */
export const finalizationMessage = (record: SignedTransition, timestamp: number): Uint8Array => {
    if (!Number.isSafeInteger(timestamp) || timestamp <= 0)
        throw new Error('invalid acceptance timestamp');
    const time = new Uint8Array(8);
    new DataView(time.buffer).setBigUint64(0, BigInt(timestamp));

    return concatBytes(new TextEncoder().encode('WARD FINAL v1'), transitionBody(record), time);
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
