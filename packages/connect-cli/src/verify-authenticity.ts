import type { AddressEntry, AddressMetadata, MerkleProof, TreeState } from '@trezor/connect';
import type { Device } from '@trezor/connect';
import TrezorConnect from '@trezor/connect';

import { entryToValueBytes } from './merkle-tree';

export type VerifyAndUpdateResult = {
    authentic: boolean;
    newEntryCounter: number;
};

/**
 * Verify the existing DB entry against the device and set the new Merkle root.
 *
 * Device flow (AuthDB firmware messages):
 *
 *   Lookup / verification only (dblookup):
 *     1. Compute value = entryToValueBytes(networkSymbol, entry)
 *     2. Send AuthDbLookup { address: address_bytes, value, proof: currentProof } → device
 *     3. Device recomputes leaf_hash = SHA-256(b"\x00" + address + value), evaluates MPT proof
 *        against stored root → returns AuthDbLookupResponse { valid, counter }
 *
 *   Existing entry update (dbchange):
 *     1. Verify old entry via AuthDbLookup (step above), authentic = valid
 *     2. Compute new root from updated MPT
 *     3. Send AuthDbSetRoot { root: newRoot } → device → returns AuthDbSetRootResponse { counter }
 *     4. Store { metadata: newMetadata, counter: newEntryCounter } + TreeState { root, counter } in DB
 *
 *   New entry (dbchange, no existing entry):
 *     1. Compute new root from updated MPT
 *     2. Send AuthDbSetRoot { root: newRoot } → device → returns AuthDbSetRootResponse { counter }
 *     3. Store { metadata: newMetadata, counter: newEntryCounter } + TreeState { root, counter } in DB
 *
 * @param address        Bitcoin address
 * @param networkSymbol  Network symbol (e.g. "btc")
 * @param oldEntry       Existing DB entry (null for new addresses)
 * @param _newMetadata   Metadata being written
 * @param currentProof   Proof computed from current MPT for this address (before update)
 * @param _treeState     Current tree state from DB (null if tree is empty)
 * @param newRoot        New Merkle root computed after upsert (hex string, empty if no entries)
 * @param device         Connected Trezor device
 */
export const verifyAndUpdateEntry = async (
    address: string,
    networkSymbol: string,
    oldEntry: AddressEntry | null,
    _newMetadata: AddressMetadata,
    currentProof: MerkleProof,
    _treeState: TreeState | null,
    newRoot: string,
    device?: Device,
): Promise<VerifyAndUpdateResult> => {
    const newEntryCounter = (_treeState?.counter ?? 0) + 1;

    if (!device) {
        return { authentic: true, newEntryCounter };
    }

    let authentic = false;

    // Verify old entry against device root (if device has a root stored).
    if (oldEntry !== null) {
        const addressHex = Buffer.from(address, 'utf8').toString('hex');
        const valueHex = entryToValueBytes(networkSymbol, oldEntry).toString('hex');
        const lookupResult = await TrezorConnect.authDbLookup({
            device,
            address: addressHex,
            value: valueHex,
            proof: currentProof,
        });
        if (lookupResult.success) {
            authentic = lookupResult.payload.valid;
        }
    }

    // Set new root and get the authoritative counter from the device.
    if (newRoot) {
        const setRootResult = await TrezorConnect.authDbSetRoot({
            device,
            root: newRoot,
        });
        if (setRootResult.success) {
            return { authentic, newEntryCounter: setRootResult.payload.counter };
        }
    }

    return { authentic, newEntryCounter };
};

/**
 * Verify a single address entry against the device root (used by dblookup).
 * Returns true if the device confirms the proof is valid, or true when no device
 * is connected (offline mode).
 */
export const verifyEntry = async (
    address: string,
    networkSymbol: string,
    entry: AddressEntry,
    proof: MerkleProof,
    device?: Device,
): Promise<boolean> => {
    if (!device) return true;

    const addressHex = Buffer.from(address, 'utf8').toString('hex');
    const valueHex = entryToValueBytes(networkSymbol, entry).toString('hex');

    const result = await TrezorConnect.authDbLookup({
        device,
        address: addressHex,
        value: valueHex,
        proof,
    });

    return result.success ? result.payload.valid : false;
};
