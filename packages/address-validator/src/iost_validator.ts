import { addressType } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

const iostRegex = new RegExp('^[a-z0-9_]{5,11}$');

function isValidAddress(
    address: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): boolean {
    return iostRegex.test(address);
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
