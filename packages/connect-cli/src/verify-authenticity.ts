import type { AddressEntry, AddressMetadata, MerkleProof, TreeState } from '@trezor/connect';
import type { Device } from '@trezor/connect';
import TrezorConnect from '@trezor/connect';

import { entryToValueBytes } from './merkle-tree';

export type VerifyAndUpdateResult = {
    authentic: boolean;
    newEntryCounter: number;
    newRoot: string | null;
    mac: string | null;
    deviceId: string | null;
};

/**
 * Update a leaf in the device's Merkle tree via AuthDbUpdateLeaf.
 *
 * @param inputMac       Pre-approval MAC from a prior dbapprove (skips device confirmation if valid)
 * @param inputDeviceId  Identifier of the device that produced inputMac
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
    inputMac?: string,
    inputDeviceId?: string,
    device?: Device,
): Promise<VerifyAndUpdateResult> => {
    const newEntry: AddressEntry = { metadata: newMetadata, counter: newEntryCounter };
    const oldValueHex = oldEntry !== null
        ? entryToValueBytes(networkSymbol, oldEntry).toString('hex')
        : '';
    const newValueHex = entryToValueBytes(networkSymbol, newEntry).toString('hex');
    const addressHex = Buffer.from(address, 'utf8').toString('hex');

    if (!device) {
        return { authentic: true, newEntryCounter, newRoot: null, mac: null, deviceId: null };
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
        ...(inputMac !== undefined && { mac: inputMac }),
        ...(inputDeviceId !== undefined && { device_id: inputDeviceId }),
    };

    /* eslint-disable no-console */
    console.log('[authDbUpdateLeaf] params:', JSON.stringify({
        address: addressHex,
        old_value: oldValueHex,
        new_value: newValueHex,
        proof: currentProof,
        ...(isInsert && witnessAddress !== null && {
            witness_address: Buffer.from(witnessAddress, 'utf8').toString('hex'),
            witness_value: witnessValue!.toString('hex'),
        }),
        ...(inputMac !== undefined && { mac: inputMac }),
        ...(inputDeviceId !== undefined && { device_id: inputDeviceId }),
    }, null, 2));
    /* eslint-enable no-console */

    const result = await TrezorConnect.authDbUpdateLeaf(updateParams);

    if (!result.success) {
        console.error('[authDbUpdateLeaf] FAILED:', result); // eslint-disable-line no-console
        return { authentic: false, newEntryCounter, newRoot: null, mac: null, deviceId: null };
    }

    return {
        authentic: true,
        newEntryCounter: result.payload.counter,
        newRoot: result.payload.new_root ?? null,
        mac: result.payload.mac ?? null,
        deviceId: result.payload.identifier ?? null,
    };
};

/**
 * Verify a single address entry against the device root (used by dblookup).
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

/**
 * Verify that an address is NOT in the device's Merkle tree (used by dblookup when address absent).
 */
export const verifyNonMembership = async (
    address: string,
    proof: MerkleProof,
    witnessAddress: string | null,
    witnessValue: Buffer | null,
    device?: Device,
): Promise<boolean> => {
    if (!device) return true;

    const addressHex = Buffer.from(address, 'utf8').toString('hex');

    const result = await TrezorConnect.authDbLookup({
        device,
        address: addressHex,
        proof,
        ...(witnessAddress !== null && {
            witness_address: Buffer.from(witnessAddress, 'utf8').toString('hex'),
            witness_value: witnessValue!.toString('hex'),
        }),
    });

    if (!result.success) return false;

    return result.payload.valid && result.payload.membership === false;
};
