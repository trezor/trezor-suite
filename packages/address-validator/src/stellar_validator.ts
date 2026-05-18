import { utils } from '@scure/base';
import crc from 'crc';

import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';
import type { Currency, NetworkEnvironment } from './currency-types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const base32 = utils.chain(utils.radix(32), utils.alphabet(ALPHABET), utils.join(''));
const regexp = new RegExp('^[' + ALPHABET + ']{56}$');
const ed25519PublicKeyVersionByte = 6 << 3;

function swap16(number: number): number {
    const lower = number & 0xff;
    const upper = (number >> 8) & 0xff;

    return (lower << 8) | upper;
}

function verifyChecksum(address: string): boolean {
    const bytes = base32.decode(address);
    if (bytes[0] !== ed25519PublicKeyVersionByte) {
        return false;
    }

    const payload = bytes.slice(0, -2);
    const checksum = cryptoUtils.toHex(bytes.slice(-2));
    const computedChecksum = cryptoUtils.numberToHex(swap16(crc.crc16xmodem(payload)), 2);

    return computedChecksum === checksum;
}

export const isValidAddress = (address: string): boolean => {
    if (regexp.test(address)) {
        return verifyChecksum(address);
    }

    return false;
};

export const getAddressType = (
    address: string,
    _currency?: Currency,
    _network?: NetworkEnvironment,
) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
