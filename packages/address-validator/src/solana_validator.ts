/* eslint-disable import/no-default-export */
import * as base58 from './crypto/base58';
import { addressType } from './crypto/utils';

const validator = {
    isValidAddress(address: string): boolean {
        try {
            const decoded = base58.decode(address);

            return decoded.length === 32;
        } catch {
            return false;
        }
    },
    getAddressType(address: string, _currency?: any, _networkType?: string) {
        if (this.isValidAddress(address)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};

export default validator;
