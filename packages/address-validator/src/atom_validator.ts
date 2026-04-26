/* eslint-disable import/no-default-export */
import { bech32 } from '@scure/base';

import { addressType } from './crypto/utils';

const ALLOWED_CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

const regexp = new RegExp('^(cosmos)1([' + ALLOWED_CHARS + ']+)$');

const validator = {
    isValidAddress(address: string): boolean {
        return regexp.exec(address) !== null;
    },

    verifyChecksum(address: string): boolean {
        const decoded = bech32.decode(address as `${string}1${string}`);

        return !!(decoded && decoded.words.length === 32);
    },

    getAddressType(address: string, _currency?: any, _networkType?: string) {
        if (this.isValidAddress(address)) {
            return addressType.ADDRESS;
        }

        return undefined;
    },
};

export default validator;
