import type { AddressEntry, AddressMetadata, MerkleProof, TreeState } from '@trezor/connect';
import type { Device } from '@trezor/connect';
import TrezorConnect from '@trezor/connect';

import { entryToValueBytes } from './merkle-tree';

export type VerifyAndUpdateResult = {
    authentic: boolean;
    newEntryCounter: number;
    newRoot: string | null;
};

/**
 * Update a leaf in the device's Merkle tree via AuthDbUpdateLeaf.
 *
 * Operations:
 *   INIT   : empty tree, old_value empty, proof [], no witness
 *   INSERT : old_value empty, non-membership proof + witness
 *   UPDATE : old_value non-empty, membership proof
 *   DELETE : new_value empty, membership proof (not currently used)
 *
 * @param address          Bitcoin address (utf8 string)
 * @param networkSymbol    Network symbol (e.g. "btc")
 * @param oldEntry         Existing DB entry (null for new addresses)
 * @param newMetadata      Metadata being written
 * @param currentProof     Proof computed from current MPT (membership or non-membership)
 * @param treeState        Current tree state (null if tree is empty)
 * @param newEntryCounter  Provisional counter to embed in new value
 * @param witnessAddress   For INSERT: witness leaf address (null if empty tree)
 * @param witnessValue     For INSERT: witness leaf value bytes (null if empty tree)
 * @param device           Connected Trezor device (undefined = offline mode)
 */
export const verifyAndUpdateEntry = async (
    address: string,
    networkSymbol: string,
    oldEntry: AddressEntry | null,
    newMetadata: AddressMetadata,
    currentProof: MerkleProof,
    treeState: TreeState | null,
    newEntryCounter: number,
    witnessAddress: string | null,
    witnessValue: Buffer | null,
    device?: Device,
): Promise<VerifyAndUpdateResult> => {
    const newEntry: AddressEntry = { metadata: newMetadata, counter: newEntryCounter };
    const oldValueHex = oldEntry !== null
        ? entryToValueBytes(networkSymbol, oldEntry).toString('hex')
        : '';
    const newValueHex = entryToValueBytes(networkSymbol, newEntry).toString('hex');
    const addressHex = Buffer.from(address, 'utf8').toString('hex');

    if (!device) {
        return { authentic: true, newEntryCounter, newRoot: null };
    }

    const isInsert = oldEntry === null;

    const updateParams: Parameters<typeof TrezorConnect.authDbUpdateLeaf>[0] = {
        device,
        address: addressHex,
        old_value: oldValueHex,
        new_value: newValueHex,
        proof: currentProof,
        ...(isInsert && witnessAddress !== null && {
            witness_address: Buffer.from(witnessAddress, 'utf8').toString('hex'),
            witness_value: witnessValue!.toString('hex'),
        }),
    };

    const result = await TrezorConnect.authDbUpdateLeaf(updateParams);

    if (!result.success) {
        return { authentic: false, newEntryCounter, newRoot: null };
    }

    const deviceCounter = result.payload.counter;
    const newRoot = result.payload.new_root ?? null;

    return { authentic: true, newEntryCounter: deviceCounter, newRoot };
};

/**
 * Verify a single address entry against the device root (used by dblookup).
 * Returns true if the device confirms the proof is valid, false on any error.
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
