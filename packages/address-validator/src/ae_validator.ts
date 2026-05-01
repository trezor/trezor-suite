import * as base58 from './crypto/base58';
import { addressType } from './crypto/utils';

const ALLOWED_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

const regexp = new RegExp('^(ak_)([' + ALLOWED_CHARS + ']+)$');

function verifyChecksum(address: string): boolean {
    const decoded = base58.decode(address);
    decoded.splice(-4, 4); // remove last 4 elements. Why is base 58 adding them?

    return decoded.length === 32;
}

export const isValidAddress = (address: string): boolean => {
    const match = regexp.exec(address);
    if (match !== null) {
        return verifyChecksum(match[2]);
    }

    return false;
};

export const getAddressType = (address: string, _currency?: any, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
