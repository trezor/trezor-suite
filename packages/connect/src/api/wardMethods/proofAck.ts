import type { MessagesSchema as Messages } from '@trezor/protobuf';
import type { ProofPackage } from '@trezor/ward';

/**
 * Map a normalized app-layer ProofPackage onto the wire WARDProofAck the device
 * pulls on demand (WARDProofRequest): membership → value/counter, non-membership →
 * witness_entry_key/witness_value_hash (two hashes only — no plaintext leaks across
 * apps). `appId` echoes the domain the proof is scoped to. Shared by the pull-model
 * write (wardUpdate) and label display (wardDisplayAddress).
 */
export const toProofAck = (pkg: ProofPackage, appId: string): Messages.WARDProofAck => {
    if (pkg.kind === 'membership') {
        return { value: pkg.valueHex, proof: pkg.proof, counter: pkg.counter, app_id: appId };
    }
    const ack: Messages.WARDProofAck = {
        proof: pkg.proof,
        app_id: appId,
        ...(pkg.witnessEntryKeyHex !== undefined && {
            witness_entry_key: pkg.witnessEntryKeyHex,
            witness_value_hash: pkg.witnessValueHashHex!,
        }),
    };
    // Drift guard: if we intended to attach a witness, the built wire message MUST
    // carry it. A mismatch here means the protobuf binding drifted from the field
    // names used above (e.g. a proto rename not regenerated) — which would otherwise
    // silently drop the witness and make the device reject every non-membership proof.
    if (pkg.witnessEntryKeyHex !== undefined && ack.witness_entry_key === undefined) {
        throw new Error(
            'toProofAck: witness present in ProofPackage but dropped from WARDProofAck — ' +
                'protobuf binding out of sync with the witness_entry_key/witness_value_hash fields',
        );
    }

    return ack;
};
