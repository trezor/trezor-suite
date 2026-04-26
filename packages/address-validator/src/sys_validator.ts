/* eslint-disable import/no-default-export */
import BTCValidator from './bitcoin_validator';
import { addressType } from './crypto/utils';

const regexp = new RegExp('^sys1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{39}$');

const validator = {
    isValidAddress(address: string, currency?: any, networkType?: string): boolean {
        return regexp.test(address) || BTCValidator.isValidAddress(address, currency, networkType);
    },

    getAddressType(address: string, currency?: any, networkType?: string) {
        if (this.isValidAddress(address, currency, networkType)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};

export default validator;
