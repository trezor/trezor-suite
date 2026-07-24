/**
 * @trezor/authdb/mocks — DEV/TEST ONLY.
 *
 * Debug stand-ins for the WARD Manager's Ed25519 attestations. These sign with the
 * well-known DEBUG QM seed (accepted only by debug firmware) so tests and the emulator
 * flow can drive the full WARD round without a real WM. NOT for production: a real
 * deployment gets the WM signatures from the provisioned WARD Manager, not from here.
 */
import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js';

// WARD attestation domains — must match apps.authdb._qm / trezorlib.ward.
const WARD_FINAL_DOMAIN = new TextEncoder().encode('WARD FINAL v1');
const WARD_ATTEST_DOMAIN = new TextEncoder().encode('WARD ATTEST v1');
const WARD_ATTEST_VERSION = 1;

// All-zero MAC used when the tree is empty (no root MAC to bind).
export const ZERO_MAC_HEX = '00'.repeat(32);

// Well-known DEBUG WM/QM Ed25519 seed, accepted only by debug firmware. Its public
// key is provisioned as _WM_PUBKEY_DEBUG in core/src/apps/ward/service.py
// (17b4c21f…). Stands in for the WARD Manager's signatures so the emulator flow
// works end-to-end; a real provisioned QM key is a follow-up.
export const DEBUG_QM_SEED = new TextEncoder().encode('AUTHDB QM DEBUG KEY SEED v1 ....');

const counterBE4 = (counter: number): Uint8Array => {
    const buf = new Uint8Array(4);
    new DataView(buf.buffer).setUint32(0, counter, false);

    return buf;
};

/**
 * Produce the WM final attestation the device verifies in WARDConfirmCommit:
 *     Ed25519-Sign(seed, b"WARD FINAL v1" || wallet_id || counter(4B BE) || mac)
 *
 * All inputs/outputs are hex strings to match connect's on-the-wire encoding.
 * `macHex` must be the committed candidate MAC (ZERO_MAC_HEX when the candidate
 * empties the tree). Defaults to signing with the debug seed.
 */
export const signWardUpdate = (
    walletIdHex: string,
    counter: number,
    macHex: string,
    seed: Uint8Array = DEBUG_QM_SEED,
): string => {
    const message = concatBytes(
        WARD_FINAL_DOMAIN,
        hexToBytes(walletIdHex),
        counterBE4(counter),
        hexToBytes(macHex),
    );

    return bytesToHex(ed25519.sign(message, seed));
};

/**
 * Produce the WM freshness attestation the device verifies in WARDIngestAttestation:
 *     Ed25519-Sign(seed,
 *         b"WARD ATTEST v1" || version(1B) || nonce || wallet_id || counter(4B BE) || mac)
 *
 * `nonce` is the per-round value the device minted at WARDInitSyncRound. All
 * inputs/outputs are hex; `macHex` is ZERO_MAC_HEX for an empty tree. Defaults to
 * the debug seed.
 */
export const signWmAttestation = (
    walletIdHex: string,
    nonceHex: string,
    counter: number,
    macHex: string,
    seed: Uint8Array = DEBUG_QM_SEED,
): string => {
    const message = concatBytes(
        WARD_ATTEST_DOMAIN,
        Uint8Array.of(WARD_ATTEST_VERSION),
        hexToBytes(nonceHex),
        hexToBytes(walletIdHex),
        counterBE4(counter),
        hexToBytes(macHex),
    );

    return bytesToHex(ed25519.sign(message, seed));
};
