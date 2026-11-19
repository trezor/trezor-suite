import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import {
    EMPTY_ROOT_HEX,
    type SignedTransition,
    finalizationMessage,
    normalizeRoot,
    transitionMessage,
    verifyTransition,
} from './transition';
import vectors from '../mocks/mockProtocolV2.json';
import { mockTransition } from '../mocks/mockTransition';

it('uses the canonical empty digest in signatures for both wire representations', () => {
    const record = mockTransition();
    expect(EMPTY_ROOT_HEX).toBe('dbc1b4c900ffe48d575b5da5c638040125f65db0fe3e24494b76ea986457d986');
    expect(transitionMessage(record)).toEqual(
        transitionMessage({ ...record, fromRoot: EMPTY_ROOT_HEX }),
    );
    expect(transitionMessage({ ...record, root: '' })).toEqual(
        transitionMessage({ ...record, root: EMPTY_ROOT_HEX }),
    );
});

it('normalizes the new empty digest without treating an old digest as empty', () => {
    const oldDigest = bytesToHex(sha256(Uint8Array.of(0x03)));
    expect(normalizeRoot(EMPTY_ROOT_HEX)).toBe('');
    expect(normalizeRoot(oldDigest)).toBe(oldDigest);
});

it('matches the cross-language transition vector', () => {
    const record = vectors.transition as SignedTransition;
    expect(bytesToHex(transitionMessage(record))).toBe(vectors.transitionMessage);
    expect(() => verifyTransition(record)).not.toThrow();
});

it('matches the cross-language finalization vector', () => {
    const record = vectors.transition as SignedTransition;
    const message = finalizationMessage(record, vectors.finalizationTimestamp);
    expect(bytesToHex(message)).toBe(vectors.finalizationMessage);
    expect(
        ed25519.verify(
            hexToBytes(vectors.finalizationSignature),
            message,
            hexToBytes(vectors.managerPublicKey),
        ),
    ).toBe(true);
});
