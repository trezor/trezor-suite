import { addressType } from './crypto/utils';
import * as cryptoUtils from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

function verifyChecksum(address: string): boolean {
    const normalized = address.replace('0x', '');
    const addressHash = cryptoUtils.keccak256(normalized.toLowerCase()).toString();

    for (let i = 0; i < 40; i++) {
        if (
            (parseInt(addressHash[i], 16) > 7 && normalized[i].toUpperCase() !== normalized[i]) ||
            (parseInt(addressHash[i], 16) <= 7 && normalized[i].toLowerCase() !== normalized[i])
        ) {
            return false;
        }
    }

    return true;
}

function isValidAddress(address: string): boolean {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        return false;
    }

    if (/^0x[0-9a-f]{40}$/.test(address) || /^0x?[0-9A-F]{40}$/.test(address)) {
        return true;
    }

    return verifyChecksum(address);
}

function getAddressType(
    address: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): AddressType | undefined {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
}

export { isValidAddress, verifyChecksum, getAddressType };
