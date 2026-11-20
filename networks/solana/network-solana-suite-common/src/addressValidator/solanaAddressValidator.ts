import { base58 } from '@scure/base';

import { type AddressValidator, addressType } from '@trezor/network-module-suite-common-types';
import type { SolanaNetworkSymbol } from '@trezor/network-solana-types';

export const isAddressValid = (_symbol: SolanaNetworkSymbol, address: string): boolean => {
    try {
        const decoded = base58.decode(address);

        return decoded.length === 32;
    } catch {
        return false;
    }
};

export const getAddressType = (_symbol: SolanaNetworkSymbol, address: string) => {
    if (isAddressValid(_symbol, address)) {
        return addressType.ADDRESS;
    }

    return undefined;
};

export const solanaValidator: AddressValidator<SolanaNetworkSymbol> = {
    isAddressValid,
    getAddressType,
};
