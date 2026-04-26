/* eslint-disable import/no-default-export */
import { addressType } from './crypto/utils';

const iostRegex = new RegExp('^[a-z0-9_]{5,11}$');

const validator = {
    isValidAddress(address: string): boolean {
        return iostRegex.test(address);
    },

    getAddressType(address: string, _currency?: any, _networkType?: string) {
        if (this.isValidAddress(address)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};

export default validator;
