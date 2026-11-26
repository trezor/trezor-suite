import { schnorr } from '@noble/curves/secp256k1.js';
import { hex, utf8 } from '@scure/base';

// The Trezor signs a shared address with the wallet's contact identity key over a BIP-340 tagged
// hash, never over a nostr event, so a nostr signing request cannot produce an attestation.
const CONTACT_ATTESTATION_TAG = 'trezor/contact-address/v1';

// The firmware refuses to attest or verify any other address, so neither does Suite.
const ATTESTABLE_ADDRESS = /^[0-9A-Za-z]{1,90}$/;
const PUBKEY_HEX = /^[0-9a-fA-F]{64}$/;
const SIGNATURE_HEX = /^[0-9a-fA-F]{128}$/;
const MAX_SLIP44 = 2 ** 32 - 1;

/**
 * A contact's Trezor's statement that `address` (on the SLIP-44 coin type `slip44`) is the
 * contact's own: `signature` is a BIP-340 signature by the x-only identity key `pubkey`, both hex.
 */
export type ContactAttestation = {
    pubkey: string;
    slip44: number;
    address: string;
    signature: string;
};

type GetContactAttestationDigestParams = Pick<ContactAttestation, 'slip44' | 'address'>;

export const isAttestableAddress = (address: string) => ATTESTABLE_ADDRESS.test(address);

const isSlip44 = (slip44: number) =>
    Number.isInteger(slip44) && slip44 >= 0 && slip44 <= MAX_SLIP44;

/** `SHA256(SHA256(tag) || SHA256(tag) || u32_be(slip44) || utf8(address))`, as the Trezor signs it. */
export const getContactAttestationDigest = ({
    slip44,
    address,
}: GetContactAttestationDigestParams) => {
    const slip44Bytes = new Uint8Array(4);
    new DataView(slip44Bytes.buffer).setUint32(0, slip44, false);

    return schnorr.utils.taggedHash(CONTACT_ATTESTATION_TAG, slip44Bytes, utf8.decode(address));
};

/**
 * Whether the attestation is valid. Anything malformed is simply invalid: attestations arrive as
 * pasted or relayed text.
 */
export const verifyContactAttestation = ({
    pubkey,
    slip44,
    address,
    signature,
}: ContactAttestation) => {
    if (
        !PUBKEY_HEX.test(pubkey) ||
        !SIGNATURE_HEX.test(signature) ||
        !isSlip44(slip44) ||
        !isAttestableAddress(address)
    ) {
        return false;
    }

    try {
        return schnorr.verify(
            hex.decode(signature.toLowerCase()),
            getContactAttestationDigest({ slip44, address }),
            hex.decode(pubkey.toLowerCase()),
        );
    } catch {
        // A pubkey that is no point on the curve.
        return false;
    }
};
