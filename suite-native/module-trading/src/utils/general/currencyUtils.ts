import { FiatCurrencyCode } from 'invity-api';

import {
    otherCurrenciesMap,
    supportedFiatCurrenciesMap,
} from '../../consts/general/fiatCurrencies';

export const getCurrencyLabel = (currencyCode: FiatCurrencyCode | string) => {
    const supportedCurrencyLabel = supportedFiatCurrenciesMap[currencyCode as FiatCurrencyCode];
    if (supportedCurrencyLabel) {
        return supportedCurrencyLabel;
    }

    const otherCurrencyLabel = otherCurrenciesMap[currencyCode as Lowercase<string>];
    if (otherCurrencyLabel) {
        return otherCurrencyLabel;
    }

    return currencyCode.toUpperCase();
};
