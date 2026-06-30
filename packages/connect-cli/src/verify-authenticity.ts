import type { AddressMetadata, Device } from '@trezor/connect';

/**
 * Verifies the authenticity of a database entry for a Bitcoin address.
 *
 * Future implementation: generate a Merkle proof for the entry and send it
 * to the connected device for on-device verification.
 *
 * @param _address       Bitcoin address being verified
 * @param _networkSymbol Network symbol (e.g. "btc")
 * @param _metadata      Metadata stored in the DB for this address
 * @param _device        Connected Trezor device (required for on-device Merkle proof verification)
 */
export const verifyEntryAuthenticity = async (
    _address: string,
    _networkSymbol: string,
    _metadata: AddressMetadata,
    _device?: Device,
): Promise<boolean> => true;
