import { addressType, bigNumberToBuffer } from './crypto/utils';
import type { AddressType } from './types';

const regexp = new RegExp('^[0-9]{1,20}L$');
const BUFFER_SIZE = 8;

function verifyAddress(address: string): boolean {
    const bigNumber = address.substring(0, address.length - 1);
    const addressBuffer = bigNumberToBuffer(bigNumber, BUFFER_SIZE);

    return Buffer.from(addressBuffer).slice(0, BUFFER_SIZE).equals(addressBuffer);
}

function getAddressType(address: string): AddressType | undefined {
    if (!regexp.test(address)) {
        return undefined;
    }
    if (verifyAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
}

function isValidAddress(address: string): boolean {
    return getAddressType(address) === addressType.ADDRESS;
}

export { isValidAddress, getAddressType, verifyAddress };
