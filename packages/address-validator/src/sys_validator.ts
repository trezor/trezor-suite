import * as BTCValidator from './bitcoin_validator';
import { addressType } from './crypto/utils';

const regexp = new RegExp('^sys1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{39}$');

export const isValidAddress = (address: string, currency?: any, networkType?: string): boolean =>
    regexp.test(address) || BTCValidator.isValidAddress(address, currency, networkType);

export const getAddressType = (address: string, currency?: any, networkType?: string) => {
    if (isValidAddress(address, currency, networkType)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
