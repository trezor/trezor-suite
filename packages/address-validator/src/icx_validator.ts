import { addressType } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

const regex = /^hx[0-9a-f]{40}$/g;

function isValidICXAddress(address: string): boolean {
    return address.search(regex) !== -1;
}

function isValidAddress(
    address: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): boolean {
    return isValidICXAddress(address);
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

export default {
    isValidAddress,
    getAddressType,
};
