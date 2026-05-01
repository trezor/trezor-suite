import { addressType } from './crypto/utils';

const nxtRegex = new RegExp('^NXT(-[A-Z0-9]{4}){3}-[A-Z0-9]{5}$');

export const isValidAddress = (address: string): boolean => nxtRegex.test(address);

export const getAddressType = (address: string, _currency?: any, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
