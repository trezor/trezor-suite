import { addressType, base32, keccak256Checksum, toHex } from './crypto/utils';
import type { AddressType, Currency, NetworkType } from './types';

function isValidAddress(
    addressInput: string,
    _currency?: Currency,
    _networkType?: NetworkType,
): boolean {
    const address = addressInput.toString().toUpperCase().replace(/-/g, '');
    if (!address || address.length !== 40) {
        return false;
    }

    const decoded = toHex(base32.b32decode(address));
    const stepThreeChecksum = keccak256Checksum(Buffer.from(decoded.slice(0, 42), 'hex'));

    return stepThreeChecksum === decoded.slice(42);
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

export default {
    isValidAddress,
    getAddressType,
};
