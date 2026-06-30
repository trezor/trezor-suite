import type { AddressEntry, AddressMetadata, MerkleProof, TreeState } from '@trezor/connect';
import type { Device } from '@trezor/connect';

export type VerifyAndUpdateResult = {
    authentic: boolean;
    newTreeState: TreeState;
    newEntryCounter: number;
    newProof: MerkleProof;
};

/**
 * Verifies the existing DB entry and returns updated tree state and proof for the new entry.
 *
 * Intended device flow (not yet implemented on device side):
 *
 *   Existing entry:
 *     1. Reconstruct proof from DB; send oldEntry.counter + oldEntry.proof + hash(oldMetadata) + hash(newMetadata) + treeState → device
 *     2. Device verifies proof against its stored root
 *     3. Device replaces the leaf, increments tree counter, recomputes root, returns new proof
 *     4. Store { metadata: newMetadata, counter: newEntryCounter, proof: newProof } + newTreeState in DB
 *
 *   New entry (oldEntry === null):
 *     1. Send hash(newMetadata) + treeState → device
 *     2. Device inserts new leaf, increments tree counter, recomputes root, returns proof
 *     3. Store { metadata: newMetadata, counter: 0, proof: newProof } + newTreeState in DB
 *
 *   Lookup verification:
 *     1. Send entry.counter + entry.proof + hash(entry.metadata) + treeState → device
 *     2. Device confirms proof against its stored root → authentic = true/false
 *
 * @param _address       Bitcoin address
 * @param _networkSymbol Network symbol (e.g. "btc")
 * @param _oldEntry      Existing DB entry (null for new addresses)
 * @param _newMetadata   Metadata being written
 * @param _treeState     Current tree state from DB (null if tree is empty)
 * @param _device        Connected Trezor device
 */
export const verifyAndUpdateEntry = async (
    _address: string,
    _networkSymbol: string,
    _oldEntry: AddressEntry | null,
    _newMetadata: AddressMetadata,
    _treeState: TreeState | null,
    _device?: Device,
): Promise<VerifyAndUpdateResult> => {
    // Stub: device verification not yet implemented.
    // When implemented, the device returns the real newTreeState, newEntryCounter, and newProof.
    const currentCounter = _treeState?.counter ?? 0;
    const newEntryCounter = _oldEntry !== null ? _oldEntry.counter + 1 : 0;

    return {
        authentic: true,
        newTreeState: {
            root: _treeState?.root ?? '',
            counter: currentCounter + 1,
        },
        newEntryCounter,
        newProof: [], // stub: proof will be returned by the device
    };
};
