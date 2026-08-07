import type { MessagesSchema as Messages } from '@trezor/protobuf';
import { wardLeafMode } from '@trezor/ward';

/**
 * Bridge between the host's flat (nonce, tag, ct) leaf blob and the device's
 * self-describing `LeafContent` oneof (EncryptedLeaf | PlaintextLeaf). Mirrors
 * trezorlib `ward.make_leaf_content` / `read_leaf_content` and core
 * `apps/common/ward.py`. The host is keyless: it forwards whatever encoding the
 * device produced. When the host BUILDS content (proof answers / push lookups) the
 * whole-system leaf mode (`wardLeafMode`) selects the encoding; plaintext carries the
 * packed content in the `ct` slot with empty nonce/tag.
 */
export const makeLeafContent = (
    nonce?: string,
    tag?: string,
    ct?: string,
): Messages.LeafContent | undefined => {
    // No leaf material (a non-membership answer / pull request) → no content.
    if (nonce === undefined && ct === undefined) return undefined;
    if (wardLeafMode.plaintext) {
        return { encoding: 1, plaintext: { content: ct ?? '' } };
    }

    return { encoding: 0, encrypted: { nonce: nonce ?? '', tag: tag ?? '', ct: ct ?? '' } };
};

/** Read a `LeafContent` into a flat { nonce, tag, ct } (all undefined if absent). */
export const readLeafContent = (
    content?: Messages.LeafContent,
): { nonce?: string; tag?: string; ct?: string } => {
    if (!content) return {};
    if ((content.encoding ?? 0) === 1) {
        return { nonce: '', tag: '', ct: content.plaintext?.content ?? '' };
    }
    const e = content.encrypted;

    return { nonce: e?.nonce, tag: e?.tag, ct: e?.ct };
};
