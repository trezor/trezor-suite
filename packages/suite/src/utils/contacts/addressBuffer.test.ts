import { schnorr } from '@noble/curves/secp256k1.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import { type SharedAddress } from 'src/reducers/suite/contactsReducer';
import {
    type AddressEntry,
    inboundAddressEntries,
    isFreshAttestation,
    outboundAddressEntries,
    sortAddressEntries,
} from 'src/utils/contacts/addressBuffer';
import {
    ATTESTATION_KIND,
    type Attestation,
    attestationEventId,
} from 'src/utils/contacts/attestation';

const attestation = (over: Partial<Attestation>): Attestation => ({
    npub: 'peer',
    address: 'addr',
    slip44: 0,
    createdAt: 1000,
    kind: 30078,
    signature: 'sig',
    eventId: 'evt',
    ...over,
});

const shared = (
    over: Omit<Partial<SharedAddress>, 'attestation'> & { attestation?: Partial<Attestation> },
): SharedAddress => ({
    npub: 'peer',
    sharedAt: 1000,
    ...over,
    attestation: attestation(over.attestation ?? {}),
});

describe('sortAddressEntries', () => {
    it('puts unused before used, then newest first, without mutating the input', () => {
        const input: AddressEntry[] = [
            { address: 'a', isUsed: true, createdAt: 30, slip44: 0 },
            { address: 'b', isUsed: false, createdAt: 10, slip44: 0 },
            { address: 'c', isUsed: false, createdAt: 20, slip44: 0 },
        ];
        const sorted = sortAddressEntries(input);

        expect(sorted.map(e => e.address)).toEqual(['c', 'b', 'a']);
        // The input is not mutated.
        expect(input.map(e => e.address)).toEqual(['a', 'b', 'c']);
    });
});

describe('inboundAddressEntries', () => {
    it('flattens the contact attestations, marks spent, and keeps coin/createdAt', () => {
        const verified: Record<string, Attestation> = {
            addr1: attestation({ address: 'addr1', createdAt: 5, slip44: 1 }),
            addr2: attestation({ address: 'addr2', createdAt: 8, slip44: 0 }),
        };
        const spent = { addr1: true };

        const entries = inboundAddressEntries(verified, spent, 'peer');

        expect(entries).toEqual([
            { address: 'addr1', isUsed: true, createdAt: 5, slip44: 1 },
            { address: 'addr2', isUsed: false, createdAt: 8, slip44: 0 },
        ]);
    });

    it('excludes attestations signed by another contact', () => {
        const verified: Record<string, Attestation> = {
            mine: attestation({ address: 'mine', npub: 'peer' }),
            other: attestation({ address: 'other', npub: 'someone-else' }),
        };

        const entries = inboundAddressEntries(verified, {}, 'peer');

        expect(entries.map(e => e.address)).toEqual(['mine']);
    });
});

describe('outboundAddressEntries', () => {
    it('reads the address/slip44 from the nested attestation and sharedAt as createdAt', () => {
        const sharedAddresses: Record<string, SharedAddress> = {
            a: shared({ sharedAt: 42, attestation: { address: 'a', slip44: 1 } }),
        };
        const spent = { a: true };

        const entries = outboundAddressEntries(sharedAddresses, spent, 'peer');

        expect(entries).toEqual([{ address: 'a', isUsed: true, createdAt: 42, slip44: 1 }]);
    });

    it('filters to the given contact npub', () => {
        const sharedAddresses: Record<string, SharedAddress> = {
            a: shared({ npub: 'peer', attestation: { address: 'a' } }),
            b: shared({ npub: 'other', attestation: { address: 'b' } }),
        };

        const entries = outboundAddressEntries(sharedAddresses, {}, 'peer');

        expect(entries.map(e => e.address)).toEqual(['a']);
    });
});

describe('isFreshAttestation', () => {
    const CONTACT_SECRET = hexToBytes('22'.repeat(32));
    const ADDRESS = 'bc1qcontactaddress000000000000000000000001';

    const signedAttestation = (slip44 = 0): Attestation => {
        const unsigned = {
            npub: bytesToHex(schnorr.getPublicKey(CONTACT_SECRET)),
            address: ADDRESS,
            slip44,
            createdAt: 1_700_000_000,
            kind: ATTESTATION_KIND,
        };
        const eventId = attestationEventId(unsigned);

        return {
            ...unsigned,
            eventId,
            signature: bytesToHex(schnorr.sign(hexToBytes(eventId), CONTACT_SECRET)),
        };
    };

    it('accepts an unpaid address of the coin I pay in', () => {
        expect(
            isFreshAttestation({
                attestation: signedAttestation(),
                slip44: 0,
                spentContactAddresses: {},
            }),
        ).toBe(true);
    });

    it('rejects an address of another coin or one I already paid to', () => {
        expect(
            isFreshAttestation({
                attestation: signedAttestation(1),
                slip44: 0,
                spentContactAddresses: {},
            }),
        ).toBe(false);
        expect(
            isFreshAttestation({
                attestation: signedAttestation(),
                slip44: 0,
                spentContactAddresses: { [ADDRESS]: true },
            }),
        ).toBe(false);
    });

    it('rejects a stored attestation whose address was changed after signing', () => {
        const attestation = {
            ...signedAttestation(),
            address: 'bc1qcontactaddress000000000000000000000002',
        };

        expect(isFreshAttestation({ attestation, slip44: 0, spentContactAddresses: {} })).toBe(
            false,
        );
    });
});
