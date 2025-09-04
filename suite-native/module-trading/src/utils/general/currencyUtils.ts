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

    console.error(`Trading: Currency [${currencyCode}] is not in supportedFiatCurrenciesMap`);

    const otherCurrencyLabel = otherCurrenciesMap[currencyCode as Lowercase<string>];
    if (otherCurrencyLabel) {
        return otherCurrencyLabel;
    }

    return currencyCode.toUpperCase();
};
