import { type Address, getAddress } from 'viem';

import { type Result, err, ok } from '@trezor/type-utils';

import type { DeviceCall, DeviceCallError } from './deviceSession';

export type EthereumAddressError =
    | DeviceCallError
    /** The device did not answer with 20 address bytes. */
    | { type: 'address-invalid' };

const ADDRESS_BYTES_PATTERN = /^[0-9a-f]{40}$/i;

export type GetEthereumAddressParams = {
    call: DeviceCall;
    path: number[];
};

/**
 * Reads the address of a path from the device. `show_display` is left unset, so the device
 * answers without asking for a confirmation; it may still ask for the PIN or the passphrase.
 * The legacy definition decodes the 20 address bytes as hex; the result is EIP-55 checksummed.
 */
export const getEthereumAddress = async ({
    call,
    path,
}: GetEthereumAddressParams): Promise<Result<Address, EthereumAddressError>> => {
    const response = await call('EthereumGetAddress', 'EthereumAddress', { address_n: path });
    if (!response.success) return response;

    const { address } = response.payload.message;
    if (typeof address !== 'string' || !ADDRESS_BYTES_PATTERN.test(address)) {
        return err({ type: 'address-invalid' });
    }

    return ok(getAddress(`0x${address}`));
};
