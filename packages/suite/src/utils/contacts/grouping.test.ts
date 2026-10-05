import { type Contact } from 'src/reducers/suite/contactsReducer';

import { groupContacts } from './grouping';

const contact = (npub: string, label: string): Contact => ({
    npub,
    label,
    addedAt: 0,
    isVerified: false,
});

const anna = contact('a', 'Anna');
const bob = contact('b', 'Bob');
const cora = contact('c', 'Cora');

// Stands in for the device-authority lookup: Anna and Cora are confirmed on this device.
const anchored = new Set(['a', 'c']);
const isAnchored = (candidate: Contact) => anchored.has(candidate.npub);

describe('groupContacts', () => {
    it('partitions into unverified and verified', () => {
        const groups = groupContacts([anna, bob, cora], isAnchored);

        expect(groups.unverified).toEqual([bob]);
        expect(groups.verified).toEqual([anna, cora]);
    });

    it('decides by the device authority, not by the stored verified flag', () => {
        const flaggedButNotAnchored: Contact = { ...bob, isVerified: true };
        const groups = groupContacts([flaggedButNotAnchored], isAnchored);

        expect(groups.unverified).toEqual([flaggedButNotAnchored]);
        expect(groups.verified).toEqual([]);
    });

    it('preserves input order within each group', () => {
        const groups = groupContacts([cora, anna], isAnchored);

        expect(groups.verified).toEqual([cora, anna]);
    });

    it('returns empty groups for an empty list', () => {
        expect(groupContacts([], isAnchored)).toEqual({ unverified: [], verified: [] });
    });
});
