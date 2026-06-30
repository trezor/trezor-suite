import type { AddressEntry, AddressMetadata, MerkleProof, TreeState } from '@trezor/connect';
// TreeState is used as a param (sent to device); newTreeState is computed by the caller after upsert.
import type { Device } from '@trezor/connect';

export type VerifyAndUpdateResult = {
    authentic: boolean;
    newEntryCounter: number;
};

/**
 * Verifies the existing DB entry and returns updated tree state for the new entry.
 * The caller is responsible for computing currentProof from the MPT before calling.
 *
 * Intended device flow (not yet implemented on device side):
 *
 *   Existing entry:
 *     1. Caller builds MPT from all DB entries, generates currentProof for this address
 *     2. Send oldEntry.counter + currentProof + hash(oldMetadata) + hash(newMetadata) + treeState → device
 *     3. Device verifies proof against its stored root
 *     4. Device replaces the leaf, increments tree counter, recomputes root
 *     5. Store { metadata: newMetadata, counter: newEntryCounter } + newTreeState in DB
 *     6. Next dblookup rebuilds MPT and generates fresh proof
 *
 *   New entry (oldEntry === null):
 *     1. Send hash(newMetadata) + treeState → device
 *     2. Device inserts new leaf, increments tree counter, recomputes root
 *     3. Store { metadata: newMetadata, counter: 0 } + newTreeState in DB
 *
 *   Lookup verification:
 *     1. Caller builds MPT, generates proof for address
 *     2. Send entry.counter + proof + hash(entry.metadata) + treeState → device
 *     3. Device confirms proof against its stored root → authentic = true/false
 *
 * @param _address       Bitcoin address
 * @param _networkSymbol Network symbol (e.g. "btc")
 * @param _oldEntry      Existing DB entry (null for new addresses)
 * @param _newMetadata   Metadata being written
 * @param _currentProof  Proof computed from current MPT for this address
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
    // Stub: device verification not yet implemented.
    // When implemented, the device returns authentic + the new entry counter.
    // The caller recomputes the Merkle root from all updated entries and stores it.
    const newEntryCounter = (_treeState?.counter ?? 0) + 1;

    return {
        authentic: true,
        newEntryCounter,
    };
};
