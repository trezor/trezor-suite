import type { AddressEntry, AddressMetadata, MerkleProof, TreeState } from '@trezor/connect';
import type { Device } from '@trezor/connect';

export type VerifyAndUpdateResult = {
    authentic: boolean;
    newEntryCounter: number;
};

/**
 * Verifies the existing DB entry against the device and returns the new entry counter.
 * The caller computes currentProof from the MPT and recomputes the root after upsert.
 *
 * Device flow (AuthDB firmware messages, not yet wired on connect side):
 *
 *   Lookup / verification only:
 *     1. Compute leaf_hash = SHA-256(b"\x00" + entryToBytes(address, networkSymbol, entry))
 *     2. Send AuthDbLookup { leaf_hash, proof: currentProof } → device
 *     3. Device evaluates proof against stored root → returns AuthDbLookupResponse { valid, counter }
 *
 *   Existing entry update:
 *     1. Compute old leaf_hash, verify via AuthDbLookup (step above)
 *     2. Compute new leaf_hash for newMetadata with newEntryCounter
 *     3. Rebuild MPT with updated leaf, compute new root
 *     4. Send AuthDbSetRoot { root: newRoot } → device → returns AuthDbSetRootResponse { counter }
 *     5. Store { metadata: newMetadata, counter: newEntryCounter } + TreeState { root, counter } in DB
 *
 *   New entry:
 *     1. Compute leaf_hash for newMetadata with counter = treeState.counter + 1
 *     2. Rebuild MPT with new leaf, compute new root
 *     3. Send AuthDbSetRoot { root: newRoot } → device → returns AuthDbSetRootResponse { counter }
 *     4. Store { metadata: newMetadata, counter: newEntryCounter } + TreeState { root, counter } in DB
 *
 * @param _address       Bitcoin address
 * @param _networkSymbol Network symbol (e.g. "btc")
 * @param _oldEntry      Existing DB entry (null for new addresses)
 * @param _newMetadata   Metadata being written
 * @param _currentProof  Proof computed from current MPT for this address (before update)
 * @param _treeState     Current tree state from DB (null if tree is empty)
 * @param _device        Connected Trezor device
 */
export const verifyAndUpdateEntry = async (
    _address: string,
    _networkSymbol: string,
    _oldEntry: AddressEntry | null,
    _newMetadata: AddressMetadata,
    _currentProof: MerkleProof,
    _treeState: TreeState | null,
    _device?: Device,
): Promise<VerifyAndUpdateResult> => {
    // Stub: AuthDbLookup / AuthDbSetRoot not yet called.
    // When implemented:
    //   - AuthDbLookup verifies _currentProof against device root → authentic
    //   - AuthDbSetRoot stores the new root computed by caller after upsert → newEntryCounter
    const newEntryCounter = (_treeState?.counter ?? 0) + 1;

    return { authentic: true, newEntryCounter };
};
