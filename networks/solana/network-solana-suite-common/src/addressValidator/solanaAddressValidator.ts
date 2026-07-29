import { base58 } from '@scure/base';

import { type AddressValidator, addressType } from '@trezor/network-module-suite-common-types';

import type { SolanaNetworkSymbol } from '../supportedNetworks';

export const isAddressValid = (address: string, _symbol: SolanaNetworkSymbol): boolean => {
    try {
        const decoded = base58.decode(address);

        return decoded.length === 32;
    } catch {
        return false;
    }
};

export const getAddressType = (address: string, _symbol: SolanaNetworkSymbol) => {
    if (isAddressValid(address, _symbol)) {
        return addressType.ADDRESS;
    }

    return undefined;
};

export const solanaValidator: AddressValidator<SolanaNetworkSymbol> = {
    isAddressValid,
    getAddressType,
};
