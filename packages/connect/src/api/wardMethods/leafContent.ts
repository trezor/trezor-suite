import type { MessagesSchema as Messages } from '@trezor/protobuf';
import type { LeafPart } from '@trezor/ward';
import { ENC_ENCRYPTED, ENC_PLAINTEXT } from '@trezor/ward';

/**
 * Bridge between the host's stored leaf parts and the device's two self-describing
 * oneofs — `LeafContent` (EncryptedLeaf | PlaintextLeaf) for the value and
 * `LeafIdentity` (EncryptedIdentity | PlainIdentity) for the entry_key preimage.
 * Mirrors trezorlib `ward.make_leaf_content` / `make_leaf_identity` and core
 * `apps/common/ward.py`.
 *
 * The host is keyless: it forwards whatever encoding the device produced, part by
 * part, and never needs to know which that is — the encoding byte travels with the
 * part and is committed. `key_type` is always clear on LeafIdentity: it selects both
 * K_ident and K_data, so it cannot itself be sealed.
 */
export const makeLeafContent = (part?: LeafPart): Messages.LeafContent | undefined => {
    // No content part at all (a non-membership answer / pull request) → no content.
    if (!part) return undefined;
    if (part.encoding === ENC_PLAINTEXT) {
        return { encoding: 1, plaintext: { content: part.bodyHex } };
    }

    return {
        encoding: 0,
        encrypted: { nonce: part.nonceHex, tag: part.tagHex, ct: part.bodyHex },
    };
};

/** Read a `LeafContent` into a LeafPart (undefined if absent). */
export const readLeafContent = (content?: Messages.LeafContent): LeafPart | undefined => {
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
 * Build a `LeafIdentity`. The plaintext arm carries the preimage FIELDS (identifier,
 * app_id, device_id) rather than packed bytes, so a host in plaintext-identity mode
 * can index by them with no keys at all — that is what makes the PUSH migration a
 * mode switch rather than a key export. The host cannot repack them, so it forwards a
 * plaintext identity only as the device sent it.
 *
 * An EMPTY part yields undefined: a deleted leaf no longer exists, so there is no
 * identity to describe.
 */
export const makeLeafIdentity = (
    keyType: string,
    part?: LeafPart,
    plain?: { identifier: string; appId: string; deviceId: number },
): Messages.LeafIdentity | undefined => {
    if (!part || part.bodyHex === '') return undefined;
    if (part.encoding === ENC_PLAINTEXT) {
        return {
            encoding: 1,
            key_type: keyType,
            plain: {
                identifier: plain?.identifier ?? '',
                app_id: plain?.appId ?? '',
                device_id: plain?.deviceId ?? 0,
            },
        };
    }

    return {
        encoding: 0,
        key_type: keyType,
        encrypted: { nonce: part.nonceHex, tag: part.tagHex, ct: part.bodyHex },
    };
};

/** Read a `LeafIdentity` into { keyType, part, plain? }. */
export const readLeafIdentity = (
    identity?: Messages.LeafIdentity,
): {
    keyType: string;
    part?: LeafPart;
    plain?: { identifier: string; appId: string; deviceId: number };
} => {
    if (!identity) return { keyType: 'address' };
    const keyType = identity.key_type ?? 'address';
    if ((identity.encoding ?? 0) === 1) {
        const p = identity.plain;

        return {
            keyType,
            part: { encoding: ENC_PLAINTEXT, nonceHex: '', tagHex: '', bodyHex: '' },
            plain: {
                identifier: p?.identifier ?? '',
                appId: p?.app_id ?? '',
                deviceId: p?.device_id ?? 0,
            },
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
