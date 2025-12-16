import { addressType } from './crypto/utils';
import { decode as base58Decode } from './crypto/base58';
import type { AddressType, Currency, NetworkType } from './types';

function isValidAddress(
    address: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): boolean {
    try {
        const decoded = base58Decode(address);
        return decoded.length === 32;
    } catch (err) {
        return false;
    }
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
