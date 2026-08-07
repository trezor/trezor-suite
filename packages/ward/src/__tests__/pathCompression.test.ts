import { computeRootFromBlobs, nonMembershipByKey, proofByKey } from '../proof';
import type { BlobRow } from '../proof';

// Cross-implementation parity for the KEYED device-blob path — the load-bearing invariant:
// proofs connect builds via @trezor/ward MUST be byte-identical to what the hardened firmware
// (path-compressed, anti-malleable trie) verifies. The vectors below were generated from the
// trezorlib reference `authdb_tree.WARDTree` (which is byte-identical to the firmware) over the
// same device-blob set — regenerate with tools alongside authdb_tree.py if the trie format changes.
//
//   internal   = SHA-256(0x01 || u16(split_bit) || u16(skiplen) || left || right)
//   proof elem = u16(split_bit) || u16(skiplen) || 32-byte sibling  (36 bytes / 72 hex)

const BLOBS: BlobRow[] = [
    [
        'b6d56e46fb665738a83c99fca9e215b1ac0b7cb19b5a659ca98bbf2e67b3e49f',
        '101010101010101010101010',
        '20202020202020202020202020202020',
        '636970686572746578742d30',
    ],
    [
        '358b7591f24d313e523c7b34b8bd513e4310e08d058aee11d679ba41958853fe',
        '111111111111111111111111',
        '21212121212121212121212121212121',
        '636970686572746578742d31',
    ],
    [
        'a4d69d3ec67354d851fc9ffae6d68e2fd15cfbebbcfe4cb4067b6fac22907e6b',
        '121212121212121212121212',
        '22222222222222222222222222222222',
        '636970686572746578742d32',
    ],
    [
        'f88fb2e0a370e737e5c4e0c36ea8badcde2e8ec947ba1325f417e07f229bb21a',
        '131313131313131313131313',
        '23232323232323232323232323232323',
        '636970686572746578742d33',
    ],
].map(([entryKeyHex, nonceHex, tagHex, ctHex]) => ({
    entryKeyHex: entryKeyHex!,
    nonceHex: nonceHex!,
    tagHex: tagHex!,
    ctHex: ctHex!,
    entryType: 'address',
}));

// trezorlib.authdb_tree.WARDTree over BLOBS (== firmware):
const REF_ROOT = '3807c1b543f81f5724c5f1bf0215a0ea94dd80bf9986e84933b4edc7a0ed2115';
const MEMBER_KEY = '358b7591f24d313e523c7b34b8bd513e4310e08d058aee11d679ba41958853fe';
const MEMBER_PROOF = ['000000008bec33d4889282b0880213c423ed8aebb39c12a63d30926bffc2c0e6945161c0'];
const ABSENT_KEY = '5ad38304b535c2987dbd24657c1a11b884984ff600d9f389deb0d4e634fee792';
const WITNESS_KEY = '358b7591f24d313e523c7b34b8bd513e4310e08d058aee11d679ba41958853fe';
const WITNESS_COMMIT = 'e3d99ec40812a024b30264dea6e7c0d7904a5229c585b46959ed4b47bb481a11';
const NONMEMBER_PROOF = [
    '000000008bec33d4889282b0880213c423ed8aebb39c12a63d30926bffc2c0e6945161c0',
];

describe('path-compressed trie — cross-impl parity with trezorlib/firmware (keyed path)', () => {
    it('computeRootFromBlobs matches the reference root', () => {
        expect(computeRootFromBlobs(BLOBS)).toBe(REF_ROOT);
    });

    it('proofByKey matches the reference membership proof (72-hex elements)', () => {
        const proof = proofByKey(BLOBS, MEMBER_KEY);
        expect(proof).toEqual(MEMBER_PROOF);
        proof.forEach(e => expect(e).toHaveLength(72));
    });

    it('nonMembershipByKey matches the reference witness + proof', () => {
        const nm = nonMembershipByKey(BLOBS, ABSENT_KEY);
        expect(nm.witnessEntryKeyHex).toBe(WITNESS_KEY);
        expect(nm.witnessCommitHex).toBe(WITNESS_COMMIT);
        expect(nm.proof).toEqual(NONMEMBER_PROOF);
    });
});
