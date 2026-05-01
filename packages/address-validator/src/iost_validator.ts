import { addressType } from './crypto/utils';

const iostRegex = new RegExp('^[a-z0-9_]{5,11}$');

export const isValidAddress = (address: string): boolean => iostRegex.test(address);

export const getAddressType = (address: string, _currency?: any, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
