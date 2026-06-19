import {
    type AddressValidator,
    addressType,
} from '@network-module/suite-types/src/AddressValidator';
import { utils } from '@scure/base';
import crc16xmodem from 'crc/calculators/crc16xmodem';

import * as cryptoUtils from './crypto/utils';

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
    const computedChecksum = cryptoUtils.numberToHex(swap16(crc16xmodem(payload)), 2);

    return computedChecksum === checksum;
}

export const isAddressValid = (address: string, _symbol: string): boolean => {
    if (regexp.test(address)) {
        return verifyChecksum(address);
    }

    return false;
};

export const getAddressType = (address: string, _symbol: string) => {
    if (isAddressValid(address, _symbol)) {
        return addressType.ADDRESS;
    }

    return undefined;
};

const getSupportedCoins: AddressValidator['getSupportedCoins'] = () => ['xlm', 'txlm'];

export const stellarValidator: AddressValidator = {
    isAddressValid,
    getAddressType,
    getSupportedCoins,
};
