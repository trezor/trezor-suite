import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex } from '@noble/hashes/utils.js';

import { type SignedTransition, genesisNonce, transitionMessage } from '../src/transition';

export const mockTransition = (overrides: Partial<SignedTransition> = {}): SignedTransition => {
    const key = new Uint8Array(32).fill(18);
    const record: SignedTransition = {
        wardId: bytesToHex(ed25519.getPublicKey(key)),
        fromCounter: 0,
        fromRoot: '',
        counter: 1,
        root: 'aa'.repeat(32),
        mac: '11'.repeat(32),
        authCommit: '33'.repeat(32),
        signature: '',
        kind: 'commit',
        headNonce: genesisNonce(bytesToHex(ed25519.getPublicKey(key))),
        ...overrides,
    };
    record.signature = bytesToHex(ed25519.sign(transitionMessage(record), key));
    return record;
};
