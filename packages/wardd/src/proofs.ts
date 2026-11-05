/**
 * Serving the device's pulls: a WARDProofAck for the `entry_key` in a WARDProofRequest, built from
 * the stored device leaves, and the bridge between stored leaf parts and the wire's two
 * self-describing oneofs -- `LeafContent` (EncryptedLeaf | PlaintextLeaf) for the value and
 * `LeafIdentity` (EncryptedIdentity | PlainIdentity) for the entry_key preimage.
 *
 * Moved here from Connect (`proofAck.ts`, `leafContent.ts`). The host is keyless: it forwards
 * whatever encoding the device produced, part by part, and serves BY the opaque entry_key. Bodies
 * are relay JSON (snake_case fields, bytes as hex). Mirrors trezorlib `ward.build_proof_ack`.
 */
import {
    type BlobRow,
    ENC_ENCRYPTED,
    ENC_PLAINTEXT,
    type LeafPart,
    nonMembershipByKey,
    proofByKey,
} from '@trezor/ward';

type Body = Record<string, any>;

export const makeLeafContent = (part?: LeafPart): Body | undefined => {
    // No content part at all (a non-membership answer / pull request) -> no content.
    if (!part) return undefined;
    if (part.encoding === ENC_PLAINTEXT) {
        return { encoding: 1, plaintext: { content: part.bodyHex } };
    }

    return {
        encoding: 0,
        encrypted: { nonce: part.nonceHex, tag: part.tagHex, ct: part.bodyHex },
    };
};

export const readLeafContent = (content?: Body): LeafPart | undefined => {
    if (!content) return undefined;
    if ((content.encoding ?? 0) === 1) {
        return {
            encoding: ENC_PLAINTEXT,
            nonceHex: '',
            tagHex: '',
            bodyHex: content.plaintext?.content ?? '',
        };
    }
    const e = content.encrypted;
    if (!e) return undefined;

    return {
        encoding: ENC_ENCRYPTED,
        nonceHex: e.nonce ?? '',
        tagHex: e.tag ?? '',
        bodyHex: e.ct ?? '',
    };
};

/**
 * An EMPTY part yields undefined: a deleted leaf no longer exists, so there is no identity to
 * describe. A plaintext identity is forwarded only as the device sent it -- the host cannot repack
 * the preimage fields.
 */
export const makeLeafIdentity = (keyType: string, part?: LeafPart): Body | undefined => {
    if (!part || part.bodyHex === '') return undefined;
    if (part.encoding === ENC_PLAINTEXT) {
        return {
            encoding: 1,
            key_type: keyType,
            plain: { identifier: '', app_id: '', device_id: 0 },
        };
    }

    return {
        encoding: 0,
        key_type: keyType,
        encrypted: { nonce: part.nonceHex, tag: part.tagHex, ct: part.bodyHex },
    };
};

export const readLeafIdentity = (identity?: Body): { keyType: string; part?: LeafPart } => {
    if (!identity) return { keyType: 'address' };
    const keyType = identity.key_type ?? 'address';
    if ((identity.encoding ?? 0) === 1) {
        return {
            keyType,
            part: { encoding: ENC_PLAINTEXT, nonceHex: '', tagHex: '', bodyHex: '' },
        };
    }
    const e = identity.encrypted;
    if (!e) return { keyType };

    return {
        keyType,
        part: {
            encoding: ENC_ENCRYPTED,
            nonceHex: e.nonce ?? '',
            tagHex: e.tag ?? '',
            bodyHex: e.ct ?? '',
        },
    };
};

/**
 * The WARDProofAck for `entryKeyHex` over the stored leaves:
 *
 *   empty tree      -> { proof: [] } (INIT)
 *   membership      -> identity + content + proof (both leaf parts)
 *   non-membership  -> witness_entry_key + witness_commit + proof (two hashes only)
 */
export const buildProofAck = (rows: BlobRow[], entryKeyHex: string): Body => {
    if (rows.length === 0) return { proof: [] };

    const membership = rows.find(r => r.entryKeyHex === entryKeyHex);
    if (membership) {
        return {
            proof: proofByKey(rows, entryKeyHex),
            content: makeLeafContent(membership.content),
            identity: makeLeafIdentity(membership.keyType, membership.identity),
        };
    }

    const nm = nonMembershipByKey(rows, entryKeyHex);
    // A non-empty tree MUST yield a witness for an absent key: an empty non-membership ack is one
    // the device rejects for an INSERT, so fail here where the cause is visible.
    if (nm.witnessEntryKeyHex === null || nm.witnessCommitHex === null) {
        throw new Error(
            `buildProofAck: non-membership over ${rows.length} leaves produced no witness ` +
                `for entry_key=${entryKeyHex} -- proof generation is inconsistent`,
        );
    }

    return {
        proof: nm.proof,
        witness_entry_key: nm.witnessEntryKeyHex,
        witness_commit: nm.witnessCommitHex,
    };
};
