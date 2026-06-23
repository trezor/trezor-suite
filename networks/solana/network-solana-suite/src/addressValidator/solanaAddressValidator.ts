import { type AddressValidator, addressType } from '@network-module/suite-types';
import { base58 } from '@scure/base';

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

export const solanaValidator: AddressValidator = {
    isAddressValid,
    getAddressType,
};
