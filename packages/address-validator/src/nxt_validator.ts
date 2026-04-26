/* eslint-disable import/no-default-export */
import { addressType } from './crypto/utils';

const nxtRegex = new RegExp('^NXT(-[A-Z0-9]{4}){3}-[A-Z0-9]{5}$');

const validator = {
    isValidAddress(address: string): boolean {
        return nxtRegex.test(address);
    },

    getAddressType(address: string, _currency?: any, _networkType?: string) {
        if (this.isValidAddress(address)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};

export default validator;
