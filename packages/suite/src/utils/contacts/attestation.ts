/**
 * Address attestation: "this address belongs to the wallet behind identity X".
 *
 * Bob's device signs a NIP-01 event with the SAME nostr identity key it exports as
 * his contact identity, so Alice can check the signature against the npub she
 * already stored — she never has to trust the transport.
 *
 * WHY WE VERIFY RATHER THAN RECOVER: the firmware signs with BIP-340 Schnorr
 * (`bip340.sign` in core/src/apps/nostr/sign_event.py). Schnorr signatures are NOT
 * recoverable, so the old prototype's "recover the pubkey from the signature"
 * approach cannot work. It also does not need to: the npub IS the trie key, so the
 * verifier always knows which key to check against.
 *
 * WHY content = `<slip44>:<address>`:
 *  - slip44 binds the network, otherwise a testnet attestation replays as mainnet.
 *  - the firmware's NIP-01 serializer does no JSON escaping and drops empty tag
 *    values, so we keep tags empty and restrict the content to characters that need
 *    no escaping (bech32/base58 are alphanumeric; the only extra char is the colon).
 *    Within that alphabet the naive serializer and JSON.stringify agree exactly.
 */
import { schnorr } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';

import { bytesToHex, hexToBytes } from './npub';

/** Application-specific nostr event kind for a contact address attestation. */
export const ATTESTATION_KIND = 27923;

/** Mirrors the on-device charset check; see apps/authlabel/bind.py. */
const ADDRESS_RE = /^[0-9A-Za-z]{1,90}$/;

export type Attestation = {
    /** signer identity, 64-char hex x-only pubkey */
    npub: string;
    address: string;
    slip44: number;
    createdAt: number;
    kind: number;
    /** 64-byte BIP-340 signature, hex */
    signature: string;
    /** sha256 of the serialized event, hex — the value that was signed */
    eventId: string;
};

export const attestationContent = (slip44: number, address: string) => `${slip44}:${address}`;

export const assertAttestableAddress = (address: string) => {
    if (!ADDRESS_RE.test(address)) {
        throw new Error('Address contains characters that cannot be attested');
    }
};

/**
 * NIP-01 event id: sha256 over [0, pubkey, created_at, kind, tags, content].
 * JSON.stringify performs the correct NIP-01 escaping; for our restricted content it
 * produces exactly what the firmware's f-string serializer produces.
 */
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
 * Verifies an attestation against a KNOWN identity. Returns false rather than
 * throwing for any malformed input — this runs on data received over a relay.
 */
export const verifyAttestation = (attestation: Attestation, expectedNpub: string) => {
    try {
        if (attestation.npub !== expectedNpub) return false;
        if (attestation.kind !== ATTESTATION_KIND) return false;
        if (!ADDRESS_RE.test(attestation.address)) return false;
        if (!Number.isInteger(attestation.slip44) || attestation.slip44 < 0) return false;
        if (!/^[0-9a-f]{128}$/.test(attestation.signature)) return false;

        const eventId = attestationEventId(attestation);
        // the id must match what was signed, otherwise the signature covers
        // something other than the address we are about to trust
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

/** Compact transport form, used for copy-paste and as the relay payload. */
export const encodeAttestation = (a: Attestation) => JSON.stringify(a);

export const decodeAttestation = (raw: string): Attestation | null => {
    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return null;
        const { npub, address, slip44, createdAt, kind, signature, eventId } = parsed;
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
