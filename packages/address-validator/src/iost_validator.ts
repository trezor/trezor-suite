import { addressType } from './crypto/utils';
import type { Currency } from './currency-types';

const iostRegex = new RegExp('^[a-z0-9_]{5,11}$');

export const isValidAddress = (address: string): boolean => iostRegex.test(address);

export const getAddressType = (address: string, _currency?: Currency, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
