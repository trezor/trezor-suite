import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';

function verifyChecksum(address: string): boolean {
    const checksumBytes = address.slice(0, 32 * 2);
    const check = address.slice(32 * 2, 38 * 2);
    const blakeHash = cryptoUtils.blake2b(checksumBytes, 32).slice(0, 6 * 2);

    return blakeHash === check;
}

export const isValidAddress = (address: string): boolean => {
    if (address.length !== 76) {
        return false;
    }

    return verifyChecksum(address);
};

export const getAddressType = (address: string, _currency?: any, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
