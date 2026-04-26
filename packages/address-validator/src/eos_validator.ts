/* eslint-disable import/no-default-export */
import { addressType } from './crypto/utils';

function isValidEOSAddress(address: string): boolean {
    const regex = /^[a-z0-9]+$/g;
    if (address.search(regex) !== -1 && address.length === 12) {
        return true;
    }

    return false;
}

const validator = {
    isValidAddress(address: string): boolean {
        return isValidEOSAddress(address);
    },

    getAddressType(address: string, _currency?: any, _networkType?: string) {
        if (this.isValidAddress(address)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};

export default validator;
