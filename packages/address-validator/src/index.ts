/* eslint-disable import/no-default-export */
import { addressType } from './crypto/utils';
import * as currencies from './currencies';
import type { Currency } from './currencies';

type AddressType = (typeof addressType)[keyof typeof addressType];

const DEFAULT_CURRENCY_NAME = 'bitcoin';

export function validate(
    address: string,
    currencyNameOrSymbol?: string,
    networkType?: string,
): boolean {
    const currency = currencies.getByNameOrSymbol(currencyNameOrSymbol || DEFAULT_CURRENCY_NAME);

    if (currency && currency.validator) {
        return currency.validator.isValidAddress(address, currency, networkType);
    }

    throw new Error('Missing validator for currency: ' + currencyNameOrSymbol);
}

export function getAddressType(
    address: string,
    currencyNameOrSymbol?: string,
    networkType?: string,
): AddressType | undefined {
    const currency = currencies.getByNameOrSymbol(currencyNameOrSymbol || DEFAULT_CURRENCY_NAME);
    if (!currency || !currency.validator) {
        throw new Error('getAddressType: No validator for currency: ' + currencyNameOrSymbol);
    }
    if (currency.validator.getAddressType) {
        return currency.validator.getAddressType(address, currency, networkType);
    }
    throw new Error('getAddressType not defined for currency: ' + currencyNameOrSymbol);
}

export function getCurrencies(): Currency[] {
    return currencies.getAll();
}

export function findCurrency(symbol: string): Currency | null {
    return currencies.getByNameOrSymbol(symbol) || null;
}

export { addressType };
export type { Currency, AddressType };

const addressValidator = {
    validate,
    getAddressType,
    getCurrencies,
    findCurrency,
    addressType,
};

export default addressValidator;
