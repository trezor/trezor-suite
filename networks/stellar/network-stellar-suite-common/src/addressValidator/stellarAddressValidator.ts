import { bytesToHex } from '@noble/hashes/utils.js';
import { utils } from '@scure/base';
import crc16xmodem from 'crc/calculators/crc16xmodem';

import { type AddressValidator, addressType } from '@trezor/network-module-suite-common-types';

import type { StellarNetworkSymbol } from '../supportedNetworks';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const base32 = utils.chain(utils.radix(32), utils.alphabet(ALPHABET), utils.join(''));
const regexp = new RegExp('^[' + ALPHABET + ']{56}$');
const ed25519PublicKeyVersionByte = 6 << 3;

function swap16(number: number): number {
    const lower = number & 0xff;
    const upper = (number >> 8) & 0xff;

    return (lower << 8) | upper;
}

const numberToHex = (number: number, sizeInBytes: number): string =>
    Math.round(number)
        .toString(16)
        .padStart(sizeInBytes * 2, '0');

function verifyChecksum(address: string): boolean {
    const bytes = base32.decode(address);
    if (bytes[0] !== ed25519PublicKeyVersionByte) {
        return false;
    }

    const payload = bytes.slice(0, -2);
    const checksum = bytesToHex(Uint8Array.from(bytes.slice(-2)));
    const computedChecksum = numberToHex(swap16(crc16xmodem(payload)), 2);

    return computedChecksum === checksum;
}

export const isAddressValid = (address: string, _symbol: StellarNetworkSymbol): boolean => {
    if (regexp.test(address)) {
        return verifyChecksum(address);
    }

    return false;
};

export const getAddressType = (address: string, _symbol: StellarNetworkSymbol) => {
    if (isAddressValid(address, _symbol)) {
        return addressType.ADDRESS;
    }

    return undefined;
};

export const stellarValidator: AddressValidator<StellarNetworkSymbol> = {
    isAddressValid,
    getAddressType,
};
