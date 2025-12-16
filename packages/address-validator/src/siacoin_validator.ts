import isEqual from 'lodash/isEqual';

import { addressType, blake2b } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

function verifyChecksum(address: string): boolean {
    const checksumBytes = address.slice(0, 32 * 2);
    const check = address.slice(32 * 2, 38 * 2);
    const blakeHash = blake2b(checksumBytes, 32).slice(0, 6 * 2);

    return isEqual(blakeHash, check);
}

function isValidAddress(
    address: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): boolean {
    if (address.length !== 76) {
        return false;
    }

    return verifyChecksum(address);
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

export { isValidAddress, verifyChecksum, getAddressType };
