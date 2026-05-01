type Currency = {
    symbol: string;
};

// Keep Storybook aligned with the named-export surface of @trezor/address-validator.
export const addressType = {
    ADDRESS: 'address',
    P2PKH: 'p2pkh',
    P2WPKH: 'p2wpkh',
    P2WSH: 'p2wsh',
    P2SH: 'p2sh',
    P2TR: 'p2tr',
    WITNESS_UNKNOWN: 'p2w-unknown',
} as const;

export const validate = (): boolean => false;

export const getAddressType = (): undefined => undefined;

export const getCurrencies = (): Currency[] => [];

export const findCurrency = (): null => null;
