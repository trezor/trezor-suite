// Address attestation: "this address belongs to the wallet behind identity X".
//
// The device signs a NIP-01 event with the same Nostr identity key that it exports as the contact
// identity, so the receiving wallet checks the signature against the npub it already stores and
// never has to trust the transport. The signature is BIP-340 Schnorr, which is not recoverable, so
// the verifier always checks against a known npub instead of recovering one.
//
// The content is `<slip44>:<address>` with empty tags. slip44 binds the network, otherwise a testnet
// attestation would replay as mainnet. The content is restricted to characters that need no JSON
// escaping (bech32 and base58 are alphanumeric, plus the colon), so JSON.stringify here and every
// firmware serializer produce the same bytes, whether or not that serializer escapes.
import { schnorr } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

import { isContactsSlip44 } from 'src/utils/contacts/coin';

/** Application-specific Nostr event kind of a contact address attestation. */
export const ATTESTATION_KIND = 27923;

const ADDRESS_RE = /^[0-9A-Za-z]{1,90}$/;
// Bitcoin mainnet, testnet and regtest. No base58 address of these networks starts this way.
const BECH32_PREFIX_RE = /^(bc|tb|bcrt)1/i;
// A contact could otherwise skew buffer ordering with a far-future timestamp; two hours cover
// ordinary clock drift.
const MAX_CLOCK_DRIFT_SEC = 2 * 60 * 60;

export type Attestation = {
    /** Signer identity, 64-char hex x-only public key. */
    npub: string;
    address: string;
    slip44: number;
    /** Unix seconds. */
    createdAt: number;
    kind: number;
    /** 64-byte BIP-340 signature, hex. */
    signature: string;
    /** sha256 of the serialized event, hex: the value that was signed. */
    eventId: string;
};

export const attestationContent = (slip44: number, address: string) => `${slip44}:${address}`;

/**
 * Upper- or mixed-case bech32 is rejected: the send form lowercases it, so a stored upper-case
 * address would never match what was paid, and a contact could get one address paid twice through
 * its case variants. The signature covers the exact text, so it cannot be lowercased on receipt.
 * Base58 is case-sensitive and passes as is.
 */
export const isAttestableAddress = (address: string) =>
    ADDRESS_RE.test(address) &&
    (!BECH32_PREFIX_RE.test(address) || address === address.toLowerCase());

export const assertAttestableAddress = (address: string) => {
    if (!isAttestableAddress(address)) {
        throw new Error('Address cannot be attested');
    }
};

/** NIP-01 event id: sha256 over `[0, pubkey, created_at, kind, tags, content]`. */
export const attestationEventId = (params: {
    npub: string;
    slip44: number;
    address: string;
    createdAt: number;
    kind?: number;
}) => {
    const kind = params.kind ?? ATTESTATION_KIND;
    const content = attestationContent(params.slip44, params.address);
    const serialized = JSON.stringify([0, params.npub, params.createdAt, kind, [], content]);

    return bytesToHex(sha256(new TextEncoder().encode(serialized)));
};

/**
 * Verifies an attestation against a known identity. Returns false instead of throwing for any
 * malformed input, because it runs on data received from a relay.
 */
export const verifyAttestation = (attestation: Attestation, expectedNpub: string) => {
    try {
        if (attestation.npub !== expectedNpub) return false;
        if (attestation.kind !== ATTESTATION_KIND) return false;
        if (!isAttestableAddress(attestation.address)) return false;
        if (!isContactsSlip44(attestation.slip44)) return false;
        if (!/^[0-9a-f]{128}$/.test(attestation.signature)) return false;
        if (!Number.isInteger(attestation.createdAt) || attestation.createdAt <= 0) return false;
        if (attestation.createdAt > Math.floor(Date.now() / 1000) + MAX_CLOCK_DRIFT_SEC) {
            return false;
        }

        const eventId = attestationEventId(attestation);
        // Otherwise the signature would cover something other than the address we are about to trust.
        if (eventId !== attestation.eventId) return false;

        return schnorr.verify(
            hexToBytes(attestation.signature),
            hexToBytes(eventId),
            hexToBytes(expectedNpub),
        );
    } catch {
        return false;
    }
};

/** Transport form, used as the relay payload. */
export const encodeAttestation = (attestation: Attestation) => JSON.stringify(attestation);

export const decodeAttestation = (raw: string): Attestation | null => {
    try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return null;

        const { npub, address, slip44, createdAt, kind, signature, eventId } = parsed as Record<
            keyof Attestation,
            unknown
        >;
        if (
            typeof npub !== 'string' ||
            typeof address !== 'string' ||
            typeof slip44 !== 'number' ||
            typeof createdAt !== 'number' ||
            typeof kind !== 'number' ||
            typeof signature !== 'string' ||
            typeof eventId !== 'string'
        ) {
            return null;
        }

        return { npub, address, slip44, createdAt, kind, signature, eventId };
    } catch {
        return null;
    }
};
