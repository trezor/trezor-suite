import type { AddressEntry, AddressMetadata, MerkleProof } from '@trezor/connect';
import type { Device } from '@trezor/connect';

export type VerifyAndUpdateResult = {
    authentic: boolean;
    newProof: MerkleProof;
};

/**
 * Verifies the existing DB entry and returns a proof for the updated entry.
 *
 * Intended device flow (not yet implemented on device side):
 *
 *   Existing entry:
 *     1. Send oldEntry.proof + hash(oldEntry.metadata) + hash(newMetadata) to device
 *     2. Device verifies oldEntry.proof against its stored Merkle root
 *     3. Device replaces the leaf, recomputes root, returns new Merkle proof
 *     4. Store { metadata: newMetadata, proof: newProof } in DB
 *
 *   New entry (oldEntry === null):
 *     1. Send hash(newMetadata) to device
 *     2. Device inserts new leaf, recomputes root, returns Merkle proof
 *     3. Store { metadata: newMetadata, proof: newProof } in DB
 *
 *   Lookup verification:
 *     1. Send entry.proof + hash(entry.metadata) to device
 *     2. Device confirms proof against its stored root → authentic = true/false
 *
 * @param _address       Bitcoin address
 * @param _networkSymbol Network symbol (e.g. "btc")
 * @param _oldEntry      Existing DB entry (null for new addresses)
 * @param _newMetadata   Metadata being written
 * @param submittedProof Proof supplied by the caller (used as-is until device verification is live)
 * @param _device        Connected Trezor device
 */
export const verifyAndUpdateEntry = async (
    _address: string,
    _networkSymbol: string,
    _oldEntry: AddressEntry | null,
    _newMetadata: AddressMetadata,
    submittedProof: MerkleProof,
    _device?: Device,
): Promise<VerifyAndUpdateResult> => ({
    authentic: true, // stub: always authentic until device Merkle verification is implemented
    newProof: submittedProof, // stub: echo back the submitted proof unchanged
});
