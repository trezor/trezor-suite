import { addressType } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

// STEEM account names follow specific validation rules
function isValidAddress(
    address: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): boolean {
    if (!address) return false;

    // STEEM accounts must be 3-16 characters
    if (address.length < 3 || address.length > 16) {
        return false;
    }

    // Must start with a letter
    if (!/^[a-z]/.test(address)) {
        return false;
    }

    // Can only contain lowercase letters, numbers, and hyphens
    // No consecutive hyphens and cannot end with hyphen
    if (!/^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/.test(address)) {
        return false;
    }

    // No consecutive hyphens
    if (/--/.test(address)) {
        return false;
    }

    return true;
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
