import { addressType } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

function isValidHBarAddress(address: string): boolean {
    const split = address.split('.');
    if (split[0] !== '0' || split[1] !== '0') {
        return false;
    }

    return split[2].length <= 6 && /^\d+$/g.test(split[2]);
}

function isValidAddress(
    address: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): boolean {
    return isValidHBarAddress(address);
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
