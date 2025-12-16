import { decode as base58decode } from './crypto/base58';
import { addressType } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

const ALLOWED_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const regexp = new RegExp('^(ak_)([' + ALLOWED_CHARS + ']+)$');

function verifyChecksum(address: string): boolean {
    const decoded = base58decode(address);
    decoded.splice(-4, 4);

    return decoded.length === 32;
}

function isValidAddress(
    address: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): boolean {
    const match = regexp.exec(address);
    if (match !== null) {
        return verifyChecksum(match[2]);
    }

    return false;
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
