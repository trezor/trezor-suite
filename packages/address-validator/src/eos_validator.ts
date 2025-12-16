import { addressType } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

function isValidEOSAddress(_address: string, _currency?: Currency, _networkType?: NetworkType) {
    const regex = /^[a-z0-9]+$/g;
    return _address.search(regex) !== -1 && _address.length === 12;
}

function isValidAddress(address: string, currency?: Currency, networkType?: NetworkType): boolean {
    return isValidEOSAddress(address, currency, networkType);
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
