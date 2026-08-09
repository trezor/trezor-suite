import { schnorr } from '@noble/curves/secp256k1.js';

import { hexToBytes } from 'src/utils/contacts/npub';

import { finalizeEvent, isWellFormedEvent } from './relayClient';

const SECRET = hexToBytes('33'.repeat(32));

describe('nostr event signing', () => {
    it('produces a self-consistent, verifiable event', () => {
        const event = finalizeEvent(
            {
                created_at: 1_700_000_000,
                kind: 27924,
                tags: [['p', 'ab'.repeat(32)]],
                content: '{}',
            },
            SECRET,
        );

        expect(isWellFormedEvent(event)).toBe(true);
        expect(event.pubkey).toBe(
            Array.from(schnorr.getPublicKey(SECRET))
                .map(b => b.toString(16).padStart(2, '0'))
                .join(''),
        );
        expect(
            schnorr.verify(hexToBytes(event.sig), hexToBytes(event.id), hexToBytes(event.pubkey)),
        ).toBe(true);
    });

    it('changes the id when any signed field changes', () => {
        const base = { created_at: 1, kind: 27924, tags: [], content: 'a' };
        const a = finalizeEvent(base, SECRET);
        const b = finalizeEvent({ ...base, content: 'b' }, SECRET);
        expect(a.id).not.toBe(b.id);
    });
});

describe('isWellFormedEvent', () => {
    it('rejects anything that is not a full event', () => {
        expect(isWellFormedEvent(null)).toBe(false);
        expect(isWellFormedEvent('nope')).toBe(false);
        expect(isWellFormedEvent({ id: 'x' })).toBe(false);
        expect(
            isWellFormedEvent({
                ...finalizeEvent({ created_at: 1, kind: 1, tags: [], content: '' }, SECRET),
                tags: 'no',
            }),
        ).toBe(false);
    });
});
