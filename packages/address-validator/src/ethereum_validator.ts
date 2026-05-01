import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';

function verifyChecksum(address: string): boolean {
    const stripped = address.replace('0x', '');
    const addressHash = cryptoUtils.keccak256(stripped.toLowerCase());

    for (let i = 0; i < 40; i++) {
        if (
            (parseInt(addressHash[i], 16) > 7 && stripped[i].toUpperCase() !== stripped[i]) ||
            (parseInt(addressHash[i], 16) <= 7 && stripped[i].toLowerCase() !== stripped[i])
        ) {
            return false;
        }
    }

    return true;
}

export const isValidAddress = (address: string): boolean => {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        // Check if it has the basic requirements of an address
        return false;
    }

    if (/^0x[0-9a-f]{40}$/.test(address) || /^0x?[0-9A-F]{40}$/.test(address)) {
        // If it's all small caps or all all caps, return true
        return true;
    }

    return verifyChecksum(address);
};

export const getAddressType = (address: string, _currency?: any, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
