import type { AddressType } from './addressType';
import type { NetworkSymbol } from './networkTypes';

export type AddressValidator = {
    isAddressValid: (address: string, symbol: NetworkSymbol) => boolean;

    getAddressType: (address: string, symbol: NetworkSymbol) => AddressType | undefined;

    getSupportedCoins: () => NetworkSymbol[];
};
