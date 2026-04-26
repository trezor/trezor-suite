/* eslint-disable import/no-default-export */
import { addressType } from './crypto/utils';

function isValidICXAddress(address: string): boolean {
    const regex = /^hx[0-9a-f]{40}$/g;

    return address.search(regex) !== -1;
}

const validator = {
    isValidAddress(address: string): boolean {
        return isValidICXAddress(address);
    },

    getAddressType(address: string, _currency?: any, _networkType?: string) {
        if (this.isValidAddress(address)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};

export default validator;
