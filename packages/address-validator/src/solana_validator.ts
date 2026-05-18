import * as base58 from './crypto/base58';
import { addressType } from './crypto/utils';
import type { Currency, NetworkEnvironment } from './currency-types';

export const isValidAddress = (address: string): boolean => {
    try {
        const decoded = base58.decode(address);

        return decoded.length === 32;
    } catch {
        return false;
    }
};

export const getAddressType = (
    address: string,
    _currency?: Currency,
    _network?: NetworkEnvironment,
) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
