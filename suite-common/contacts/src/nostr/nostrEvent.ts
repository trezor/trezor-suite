import { schnorr } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hex, utf8 } from '@scure/base';
import { z } from 'zod';

// NIP-01 hex is lower case: 32-byte ids and x-only public keys, 64-byte signatures.
const HEX_32_BYTES = /^[0-9a-f]{64}$/;
const HEX_64_BYTES = /^[0-9a-f]{128}$/;

const NostrEventSchema = z.object({
    id: z.string().regex(HEX_32_BYTES),
    pubkey: z.string().regex(HEX_32_BYTES),
    created_at: z.number().int().nonnegative(),
    kind: z.number().int().nonnegative(),
    tags: z.array(z.array(z.string())),
    content: z.string(),
    sig: z.string().regex(HEX_64_BYTES),
});

export type NostrEvent = z.infer<typeof NostrEventSchema>;

export type NostrEventDraft = Pick<NostrEvent, 'created_at' | 'kind' | 'tags' | 'content'>;

type UnsignedNostrEvent = Omit<NostrEvent, 'id' | 'sig'>;

export const getNostrEventId = ({ pubkey, created_at, kind, tags, content }: UnsignedNostrEvent) =>
    hex.encode(sha256(utf8.decode(JSON.stringify([0, pubkey, created_at, kind, tags, content]))));

type FinalizeNostrEventParams = {
    draft: NostrEventDraft;
    secretKey: Uint8Array;
};

/** The draft, authored and signed by `secretKey`. */
export const finalizeNostrEvent = ({ draft, secretKey }: FinalizeNostrEventParams): NostrEvent => {
    const { created_at, kind, tags, content } = draft;
    const unsigned = {
        pubkey: hex.encode(schnorr.getPublicKey(secretKey)),
        created_at,
        kind,
        tags,
        content,
    };
    const id = getNostrEventId(unsigned);

    return { ...unsigned, id, sig: hex.encode(schnorr.sign(hex.decode(id), secretKey)) };
};

const isAuthentic = (event: NostrEvent) => {
    if (getNostrEventId(event) !== event.id) {
        return false;
    }

    try {
        return schnorr.verify(
            hex.decode(event.sig),
            hex.decode(event.id),
            hex.decode(event.pubkey),
        );
    } catch {
        // A public key that is no point on the curve.
        return false;
    }
};

/**
 * The event, if `value` is one whose id and signature match it. That proves only who authored
 * it, nothing about what it says: everything a relay delivers is attacker-controlled.
 */
export const parseNostrEvent = (value: unknown): NostrEvent | undefined => {
    const parsed = NostrEventSchema.safeParse(value);

    return parsed.success && isAuthentic(parsed.data) ? parsed.data : undefined;
};
