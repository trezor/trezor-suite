import { addressType } from './crypto/utils';

const ALLOWED_CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

const regexp = new RegExp('^(cosmos)1([' + ALLOWED_CHARS + ']+)$');

export const isValidAddress = (address: string): boolean => regexp.exec(address) !== null;

export const getAddressType = (address: string, _currency?: any, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
