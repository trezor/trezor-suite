/* eslint-disable import/no-default-export */
import { addressType } from './crypto/utils';

function isValidHBarAddress(address: string): boolean {
    const split = address.split('.');
    if (split[0] !== '0' || split[1] !== '0') {
        return false;
    }
    if (split[2].length <= 6 && /^\d+$/g.test(split[2])) {
        return true;
    }

    return false;
}

const validator = {
    isValidAddress(address: string): boolean {
        return isValidHBarAddress(address);
    },

    getAddressType(address: string, _currency?: any, _networkType?: string) {
        if (this.isValidAddress(address)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};

export default validator;
