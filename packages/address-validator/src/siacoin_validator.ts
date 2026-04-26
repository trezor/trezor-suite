/* eslint-disable import/no-default-export */
import isEqual from 'lodash/isEqual';

import * as cryptoUtils from './crypto/utils';
import { addressType } from './crypto/utils';

const validator = {
    isValidAddress(address: string): boolean {
        if (address.length !== 76) {
            return false;
        }

        return this.verifyChecksum(address);
    },
    verifyChecksum(address: string): boolean {
        const checksumBytes = address.slice(0, 32 * 2);
        const check = address.slice(32 * 2, 38 * 2);
        const blakeHash = cryptoUtils.blake2b(checksumBytes, 32).slice(0, 6 * 2);

        return isEqual(blakeHash, check);
    },

    getAddressType(address: string, _currency?: any, _networkType?: string) {
        if (this.isValidAddress(address)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};

export default validator;
