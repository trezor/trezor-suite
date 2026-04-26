/* eslint-disable import/no-default-export */
import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';

const regexp = new RegExp('^[0-9]{1,20}L$');

const validator = {
    isValidAddress(address: string): boolean {
        return this.getAddressType(address) === addressType.ADDRESS;
    },

    getAddressType(address: string) {
        if (!regexp.test(address)) {
            return undefined;
        }
        if (this.verifyAddress(address)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },

    verifyAddress(address: string): boolean {
        const BUFFER_SIZE = 8;
        const bigNumber = address.substring(0, address.length - 1);
        const addressBuffer = cryptoUtils.bigNumberToBuffer(bigNumber);

        return Buffer.from(addressBuffer).slice(0, BUFFER_SIZE).equals(addressBuffer);
    },
};

export default validator;
