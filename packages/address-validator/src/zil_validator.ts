import { bech32 } from '@scure/base';

import { addressType } from './crypto/utils';

const ALLOWED_CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

const regexp = new RegExp('^(zil)1([' + ALLOWED_CHARS + ']+)$');

export const isValidAddress = (address: string): boolean => {
    const match = regexp.exec(address);
    if (!match) {
        return false;
    }
    const decoded = bech32.decode(address as `${string}1${string}`);

    return !!(decoded && decoded.words.length === 32);
};

export const getAddressType = (address: string, _currency?: any, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
