import type { MessagesSchema as Messages } from '@trezor/protobuf';
import type { BlobRow } from '@trezor/ward';
import { nonMembershipByKey, proofByKey } from '@trezor/ward';

import { makeLeafContent } from './leafContent';

/**
 * Build the WARDProofAck the device pulls on demand, serving purely BY the opaque
 * `entryKeyHex` in the WARDProofRequest against the host's stored device leaf blobs
 * (the host holds no keys and cannot compute entry_key/leaf itself).
 *
 *   empty tree      → {} (INIT)
 *   membership      → entry_type + nonce/tag/ct + proof
 *   non-membership  → witness_entry_key + witness_commit + proof (two hashes only)
 *
 * Mirrors trezorlib ward.build_proof_ack. Must stay in sync with the WARDProofAck
 * wire fields (entry_type/nonce/tag/ct/witness_commit) — a rename not regenerated
 * would silently drop a field and make the device reject the proof.
 */
export const buildAckByKey = (rows: BlobRow[], entryKeyHex: string): Messages.WARDProofAck => {
    if (rows.length === 0) return { proof: [] };

    const membership = rows.find(r => r.entryKeyHex === entryKeyHex);
    if (membership) {
        return {
            proof: proofByKey(rows, entryKeyHex),
            entry_type: membership.entryType ?? 'address',
            content: makeLeafContent(membership.nonceHex, membership.tagHex, membership.ctHex),
        };
    }

    const nm = nonMembershipByKey(rows, entryKeyHex);
    const ack: Messages.WARDProofAck = { proof: nm.proof };
    if (nm.witnessEntryKeyHex !== null && nm.witnessCommitHex !== null) {
        ack.witness_entry_key = nm.witnessEntryKeyHex;
        ack.witness_commit = nm.witnessCommitHex;
    }
    // Drift guard: a non-empty tree MUST yield a witness for an absent key. A missing
    // witness would send an empty non-membership ack the device rejects for INSERT.
    if (ack.witness_entry_key === undefined) {
        throw new Error(
            `buildAckByKey: non-membership over ${rows.length} blob rows produced no witness ` +
                `for entry_key=${entryKeyHex} — proof generation is inconsistent`,
        );
    }

    return ack;
};
