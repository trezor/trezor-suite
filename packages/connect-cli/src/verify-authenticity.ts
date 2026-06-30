import type { AddressMetadata, Device } from '@trezor/connect';

/**
 * Verifies the authenticity of a database entry for a Bitcoin address.
 *
 * Future implementation: send metadata.proof (Merkle proof) to the connected
 * Trezor device and confirm it matches the stored entry. Returns true only
 * when the device acknowledges the proof as valid.
 *
 * @param _address       Bitcoin address being verified
 * @param _networkSymbol Network symbol (e.g. "btc")
 * @param _metadata      Metadata from the DB; metadata.proof carries the Merkle proof
 * @param _device        Connected Trezor device (required for on-device proof verification)
 */
export const verifyEntryAuthenticity = async (
    _address: string,
    _networkSymbol: string,
    _metadata: AddressMetadata,
    _device?: Device,
): Promise<boolean> => true; // stub: always authentic until proof + device verification is wired
