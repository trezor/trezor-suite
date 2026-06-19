import type { NetworkSymbol } from '@suite-common/wallet-config';

export const addressType = {
    ADDRESS: 'address',
    P2PKH: 'p2pkh',
    P2WPKH: 'p2wpkh',
    P2WSH: 'p2wsh',
    P2SH: 'p2sh',
    P2TR: 'p2tr',
    WITNESS_UNKNOWN: 'p2w-unknown',
} as const;

export type AddressType = (typeof addressType)[keyof typeof addressType];

export type AddressValidator = {
    isAddressValid: (address: string, symbol: NetworkSymbol) => boolean;

    getAddressType: (address: string, symbol: NetworkSymbol) => AddressType | undefined;

    getSupportedCoins: () => NetworkSymbol[];
};

export type AddressValidatorDep = {
    addressValidator: AddressValidator;
};
