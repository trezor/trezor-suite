import { decode as base58decode } from './crypto/base58';
import { addressType, byteArray2hexStr, hexStr2byteArray, sha256x2 } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

function decodeRaw(buffer: number[]): number[] | undefined {
    const payload = buffer.slice(0, -4);
    const checksum = buffer.slice(-4);
    const newChecksum = hexStr2byteArray(sha256x2(byteArray2hexStr(payload)));

    if (
        (checksum[0] ^ newChecksum[0]) |
        (checksum[1] ^ newChecksum[1]) |
        (checksum[2] ^ newChecksum[2]) |
        (checksum[3] ^ newChecksum[3])
    ) {
        return undefined;
    }

    return payload;
}

function isValidAddress(
    address: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): boolean {
    try {
        const buffer = base58decode(address);
        const payload = decodeRaw(buffer);
        if (!payload) return false;

        return true;
    } catch {
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

export { isValidAddress, getAddressType };
