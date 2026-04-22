export interface Currency {
    name: string;
    symbol: string;
}

export type AddressType = 'address' | 'p2pkh' | 'p2wpkh' | 'p2wsh' | 'p2sh' | 'p2tr' | 'pw-unknown';

export const addressType: {
    ADDRESS: 'address';
    P2PKH: 'p2pkh';
    P2WPKH: 'p2wpkh';
    P2WSH: 'p2wsh';
    P2SH: 'p2sh';
    P2TR: 'p2tr';
    WITNESS_UNKNOWN: 'pw-unknown';
};

export function validate(
    address: string,
    currencyNameOrSymbol?: string,
    networkType?: string,
): boolean;

export function getAddressType(
    address: string,
    currencyNameOrSymbol?: string,
    networkType?: string,
): AddressType | undefined;

export function getCurrencies(): Currency[];

export function findCurrency(symbol: string): Currency | null;
