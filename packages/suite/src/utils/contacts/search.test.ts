import { type Contact } from 'src/reducers/suite/contactsReducer';

import { filterContacts } from './search';

// NIP-19 vector: hex identity and its canonical npub1 encoding.
// npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6
const ALICE_HEX = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
const BOB_HEX = '67dea2ed018072d675f5415ecfaed7d2597555e202d85b3d65ea4e58d2d92ffa';

const contact = (npub: string, label: string): Contact => ({
    npub,
    label,
    addedAt: 0,
    isVerified: false,
});

const alice = contact(ALICE_HEX, 'Alice');
const bob = contact(BOB_HEX, 'Bob');
const roster = [alice, bob];

describe('filterContacts', () => {
    it('returns the list unchanged (same reference) for a blank query', () => {
        expect(filterContacts(roster, '')).toBe(roster);
        expect(filterContacts(roster, '   ')).toBe(roster);
    });

    it('matches on label, case-insensitively', () => {
        expect(filterContacts(roster, 'ali')).toEqual([alice]);
        expect(filterContacts(roster, 'ALICE')).toEqual([alice]);
    });

    it('matches on the npub1 encoding, case-insensitively', () => {
        // "180cvv" is a slice of Alice's npub1 encoding, not of Bob's.
        expect(filterContacts(roster, '180cvv')).toEqual([alice]);
        expect(filterContacts(roster, '180CVV')).toEqual([alice]);
    });

    it('does NOT match on the raw hex npub the user never sees', () => {
        // "3bf0" is a prefix of Alice's raw hex but appears in neither her label nor her npub1
        // encoding (bech32 has no 'b' in its data charset).
        expect(filterContacts(roster, '3bf0')).toEqual([]);
    });

    it('returns an empty list when nothing matches', () => {
        expect(filterContacts(roster, 'zzz-no-such-contact')).toEqual([]);
    });

    it('trims surrounding whitespace before matching', () => {
        expect(filterContacts(roster, '  bob  ')).toEqual([bob]);
    });
});
