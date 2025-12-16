import { addressType } from './crypto/utils';
import BTCValidator from './bitcoin_validator';
import type { AddressType, Currency, NetworkType } from './types';

const regexp = new RegExp('^sys1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{39}$');

function isValidAddress(address: string, currency: Currency, networkType?: NetworkType): boolean {
    return regexp.test(address) || BTCValidator.isValidAddress(address, currency, networkType);
}

function getAddressType(
    address: string,
    currency: Currency,
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
