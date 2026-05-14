import { addressType } from './crypto/utils';
import type { Currency } from './currency-types';

function isValidICXAddress(address: string): boolean {
    const regex = /^hx[0-9a-f]{40}$/g;

    return address.search(regex) !== -1;
}

export const isValidAddress = (address: string): boolean => isValidICXAddress(address);

export const getAddressType = (address: string, _currency?: Currency, _networkType?: string) => {
    if (isValidAddress(address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};
