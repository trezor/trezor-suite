import {
    type AddressValidator,
    addressType,
} from '@network-module/suite-types/src/AddressValidator';

import * as base58 from './crypto/base58';

export const isAddressValid = (address: string, _symbol: string): boolean => {
    try {
        const decoded = base58.decode(address);

        return decoded.length === 32;
    } catch {
        return false;
    }
};

export const getAddressType = (address: string, _symbol: string) => {
    if (isAddressValid(address, _symbol)) {
        return addressType.ADDRESS;
    }

    return undefined;
};

const getSupportedCoins: AddressValidator['getSupportedCoins'] = () => ['sol', 'dsol'];

export const solanaValidator: AddressValidator = {
    isAddressValid,
    getAddressType,
    getSupportedCoins,
};
