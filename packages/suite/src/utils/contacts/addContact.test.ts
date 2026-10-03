import { type Contact } from 'src/reducers/suite/contactsReducer';

import { evaluateContactIdentity } from './addContact';

// NIP-19 vector: hex identity and its canonical npub1 encoding.
// npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6
const ALICE_HEX = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
const ALICE_NPUB = 'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6';
const BOB_HEX = '67dea2ed018072d675f5415ecfaed7d2597555e202d85b3d65ea4e58d2d92ffa';
const OWN_HEX = 'e88a691e98d9987c964521df424f6cf8f7ac5e2ea3cd0aa3a9d5f7db4e07a370';

const contact = (npub: string): Contact => ({ npub, label: 'x', addedAt: 0, isVerified: false });

describe('evaluateContactIdentity', () => {
    const roster = { [BOB_HEX]: contact(BOB_HEX) };
    const ctx = { ownNpub: OWN_HEX, roster };

    it('reports an empty field as `empty` with no parsed npub', () => {
        expect(evaluateContactIdentity('', ctx)).toEqual({ npub: undefined, status: 'empty' });
        expect(evaluateContactIdentity('   ', ctx)).toEqual({ npub: undefined, status: 'empty' });
    });

    it('reports a malformed identity as `invalid` with a null npub', () => {
        expect(evaluateContactIdentity('not-an-npub', ctx)).toEqual({
            npub: null,
            status: 'invalid',
        });
    });

    it('accepts a fresh, well-formed identity in either encoding', () => {
        expect(evaluateContactIdentity(ALICE_HEX, ctx)).toEqual({
            npub: ALICE_HEX,
            status: 'ok',
        });
        // The npub1 form and a nostr: URI both normalise to the same hex before the roster check.
        expect(evaluateContactIdentity(ALICE_NPUB, ctx)).toEqual({
            npub: ALICE_HEX,
            status: 'ok',
        });
        expect(evaluateContactIdentity(`nostr:${ALICE_NPUB}`, ctx)).toEqual({
            npub: ALICE_HEX,
            status: 'ok',
        });
    });

    it("flags the user's own identity as `self` (still parses the npub)", () => {
        expect(evaluateContactIdentity(OWN_HEX, ctx)).toEqual({ npub: OWN_HEX, status: 'self' });
    });

    it('flags an identity already on the roster as `duplicate`', () => {
        expect(evaluateContactIdentity(BOB_HEX, ctx)).toEqual({
            npub: BOB_HEX,
            status: 'duplicate',
        });
    });

    it('treats self before duplicate when a value is both', () => {
        // Own identity that is somehow also on the roster: self wins.
        const bothCtx = { ownNpub: BOB_HEX, roster };
        expect(evaluateContactIdentity(BOB_HEX, bothCtx)).toEqual({
            npub: BOB_HEX,
            status: 'self',
        });
    });

    it('accepts anything when there is no own identity and an empty roster', () => {
        expect(
            evaluateContactIdentity(ALICE_HEX, { ownNpub: undefined, roster: undefined }),
        ).toEqual({ npub: ALICE_HEX, status: 'ok' });
    });
});
