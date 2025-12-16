import { addressType } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

const nxtRegex = new RegExp('^NXT(-[A-Z0-9]{4}){3}-[A-Z0-9]{5}$');

function isValidAddress(
    address: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): boolean {
    return nxtRegex.test(address);
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
