import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex } from '@noble/hashes/utils.js';

import { DEBUG_QM_SEED, ZERO_MAC_HEX, signWardUpdate, signWmAttestation } from '../index';

// Golden vectors captured from trezorlib.ward (the firmware-side dev signers these
// mirror), proving byte-identical Ed25519 output.
const WALLET_ID = 'aa'.repeat(20);
const MAC = 'bb'.repeat(32);
const NONCE = 'cd'.repeat(32);

// sign(DEBUG_QM_SEED, b"WARD FINAL v1" || wallet_id || counter(4B BE) || mac)
// with wallet_id = aa*20, counter = 4, mac = bb*32.
const EXPECTED_FINAL_SIG =
    '3a55d138b1eed5eb9b48b93c6c303d89eb07239c47d0654ef389fabab91e4295' +
    'bb2a24fbf6eaa6f9418c4206250023925b13207a624a37910c661cb686b66a0e';

// sign(DEBUG_QM_SEED, b"WARD ATTEST v1" || 0x01 || nonce(cd*32) || ward_id(ab*32)
//   || counter(4B BE=7) || mac(bb*32) || timestamp(8B BE=1700000000)),
// the `attestationSignature` of tools/ward_vectors.py (wardd/mocks/mockProtocolV2.json).
const ATTEST_WALLET_ID = 'ab'.repeat(32);
const EXPECTED_ATTEST_SIG =
    '3179d5c0a5ef316c5bb65d20ea64635d712ed7a62d5e77af3b974f07d8470b5ecfabb90cf2e6078168c11c4d67056d00156a1312eea64ad8151ea3f0e49b9200';

// The provisioned debug QM public key in core/src/apps/ward/_qm.py.
const QM_PUBKEY_DEBUG = '17b4c21f6b55935405d5a48ee3f2f29f42d78c9a650d8f686a705b21ef62b0b6';

describe('signWardUpdate', () => {
    it('reproduces the trezorlib golden signature', () => {
        expect(signWardUpdate(WALLET_ID, 4, MAC)).toBe(EXPECTED_FINAL_SIG);
    });

    it('derives the provisioned debug QM public key from the debug seed', () => {
        expect(bytesToHex(ed25519.getPublicKey(DEBUG_QM_SEED))).toBe(QM_PUBKEY_DEBUG);
    });

    it('signs over the all-zero MAC for a candidate that empties the tree', () => {
        // Just exercises the ZERO_MAC_HEX path — the value is 32 zero bytes.
        expect(ZERO_MAC_HEX).toBe('00'.repeat(32));
        expect(() => signWardUpdate(WALLET_ID, 9, ZERO_MAC_HEX)).not.toThrow();
    });
});

describe('signWmAttestation', () => {
    it('reproduces the trezorlib golden signature', () => {
        expect(signWmAttestation(ATTEST_WALLET_ID, NONCE, 7, MAC)).toBe(EXPECTED_ATTEST_SIG);
    });

    it('signs over the all-zero MAC for an empty-tree checkpoint', () => {
        expect(() => signWmAttestation(ATTEST_WALLET_ID, NONCE, 0, ZERO_MAC_HEX)).not.toThrow();
    });
});
