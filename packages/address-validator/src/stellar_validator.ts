import baseX from 'base-x';
import crc from 'crc';

import { addressType, numberToHex, toHex } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const base32 = baseX(ALPHABET);
const regexp = new RegExp(`^[${ALPHABET}]{56}$`);
const ed25519PublicKeyVersionByte = 6 << 3;

function swap16(number: number): number {
    const lower = number & 0xff;
    const upper = (number >> 8) & 0xff;

    return (lower << 8) | upper;
}

function verifyChecksum(address: string): boolean {
    // based on https://github.com/stellar/js-stellar-base/blob/master/src/strkey.js
    const bytes = base32.decode(address);
    if (bytes[0] !== ed25519PublicKeyVersionByte) {
        return false;
    }

    const payload = bytes.slice(0, -2);
    const checksum = toHex(bytes.slice(-2));
    const computedChecksum = numberToHex(swap16(crc.crc16xmodem(payload)), 2);

    return computedChecksum === checksum;
}

function isValidAddress(
    address: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): boolean {
    if (regexp.test(address)) {
        return verifyChecksum(address);
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
