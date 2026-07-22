import { base58 } from '@scure/base';

import { type AddressValidator, addressType } from '@trezor/network-module-suite-types';

import type { SolanaSupportedCoin } from '../supportedCoins';

export const isAddressValid = (address: string, _symbol: SolanaSupportedCoin): boolean => {
    try {
        const decoded = base58.decode(address);

        return decoded.length === 32;
    } catch {
        return false;
    }
};

export const getAddressType = (address: string, _symbol: SolanaSupportedCoin) => {
    if (isAddressValid(address, _symbol)) {
        return addressType.ADDRESS;
    }

    return undefined;
};

export const solanaValidator: AddressValidator<SolanaSupportedCoin> = {
    isAddressValid,
    getAddressType,
};
