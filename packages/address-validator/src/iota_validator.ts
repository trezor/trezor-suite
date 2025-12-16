// IOTA validation is disabled (missing dependency @iota/validators).
import { addressType } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

function isValidAddress(
    _address: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): boolean {
    return false;
}

function getAddressType(
    address: string,
    currency?: Currency,
    networkType?: NetworkType,
): AddressType | undefined {
    if (isValidAddress(address, currency, networkType)) {
        return addressType.ADDRESS;
    }

    return undefined;
}

export { isValidAddress, getAddressType };
