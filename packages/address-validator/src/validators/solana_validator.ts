import type { AddressValidator } from '../AddressValidator';
import { addressType } from '../addressType';
import * as base58 from '../crypto/base58';
import type { NetworkSymbol } from '../networkTypes';

export const isAddressValid = (address: string, _symbol: NetworkSymbol): boolean => {
    try {
        const decoded = base58.decode(address);

        return decoded.length === 32;
    } catch {
        return false;
    }
};

export const getAddressType = (address: string, _symbol: NetworkSymbol) => {
    if (isAddressValid(address, _symbol)) {
        return addressType.ADDRESS;
    }

    return undefined;
};

const getSupportedCoins = (): NetworkSymbol[] => ['sol', 'dsol'];

export const solanaValidator: AddressValidator = {
    isAddressValid,
    getAddressType,
    getSupportedCoins,
};
