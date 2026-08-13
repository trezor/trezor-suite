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
        '6964656e746974792d30',
        '303030303030303030303030',
        '40404040404040404040404040404040',
        '636970686572746578742d30',
    ],
    [
        '358b7591f24d313e523c7b34b8bd513e4310e08d058aee11d679ba41958853fe',
        '111111111111111111111111',
        '21212121212121212121212121212121',
        '6964656e746974792d31',
        '313131313131313131313131',
        '41414141414141414141414141414141',
        '636970686572746578742d31',
    ],
    [
        'a4d69d3ec67354d851fc9ffae6d68e2fd15cfbebbcfe4cb4067b6fac22907e6b',
        '121212121212121212121212',
        '22222222222222222222222222222222',
        '6964656e746974792d32',
        '323232323232323232323232',
        '42424242424242424242424242424242',
        '636970686572746578742d32',
    ],
    [
        'f88fb2e0a370e737e5c4e0c36ea8badcde2e8ec947ba1325f417e07f229bb21a',
        '131313131313131313131313',
        '23232323232323232323232323232323',
        '6964656e746974792d33',
        '333333333333333333333333',
        '43434343434343434343434343434343',
        '636970686572746578742d33',
    ],
].map(([entryKeyHex, idNonce, idTag, idBody, valNonce, valTag, valBody]) => ({
    entryKeyHex: entryKeyHex!,
    keyType: 'address',
    identity: { encoding: 0, nonceHex: idNonce!, tagHex: idTag!, bodyHex: idBody! },
    content: { encoding: 0, nonceHex: valNonce!, tagHex: valTag!, bodyHex: valBody! },
}));

// trezorlib.authdb_tree.WARDTree over BLOBS (== firmware), two-part commit:
const REF_ROOT = 'acfe9d9b2c3069070aeb21d72dd53cd7dd3245016ba461c09451d715cb2a6a2d';
const MEMBER_KEY = '358b7591f24d313e523c7b34b8bd513e4310e08d058aee11d679ba41958853fe';
const MEMBER_PROOF = ['00000000e96a5c3627be9ad15ae404da1ac72b42f1a602039dbc46fa22eb52e6071949d3'];
const ABSENT_KEY = '5ad38304b535c2987dbd24657c1a11b884984ff600d9f389deb0d4e634fee792';
const WITNESS_KEY = '358b7591f24d313e523c7b34b8bd513e4310e08d058aee11d679ba41958853fe';
const WITNESS_COMMIT = '2a36629301c9f5965be929bdbb741bbf5980f3829349748045ce20130496bb54';
const NONMEMBER_PROOF = [
    '00000000e96a5c3627be9ad15ae404da1ac72b42f1a602039dbc46fa22eb52e6071949d3',
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
