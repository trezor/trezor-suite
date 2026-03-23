import type { FiatCurrencyCode } from 'invity-api';

import type { BaseCurrencyOption } from '@suite-common/wallet-types';
import { type BaseCurrencyCode, isBaseCurrencyCode } from '@trezor/blockchain-link-types';

import {
    DEFAULT_FIAT_CURRENCY_FALLBACK,
    isSupportedFiatCurrency,
    supportedFiatCurrenciesMap,
} from '../currency';
import { type TradingFiatCurrencyOption } from '../types';

export const getCurrencyLabel = (currencyCode: FiatCurrencyCode | string): string =>
    isSupportedFiatCurrency(currencyCode)
        ? supportedFiatCurrenciesMap[currencyCode]
        : currencyCode.toUpperCase();

export const buildTradingFiatOption = (currency: FiatCurrencyCode): TradingFiatCurrencyOption => ({
    value: currency,
    label: getCurrencyLabel(currency),
});

export const mapFiatCurrencyCodeToBaseCurrencyCode = (
    fiatCurrencyCode: string | undefined,
): BaseCurrencyCode | undefined => {
    if (!fiatCurrencyCode) {
        return undefined;
    }

    return isBaseCurrencyCode(fiatCurrencyCode) ? fiatCurrencyCode : undefined;
};

export const buildTradingBaseCurrencyOptionFromFiat = (
    fiatCurrencyCode: string | undefined,
): BaseCurrencyOption => {
    const baseCurrencyCode =
        mapFiatCurrencyCodeToBaseCurrencyCode(fiatCurrencyCode) ?? DEFAULT_FIAT_CURRENCY_FALLBACK;

    return {
        value: baseCurrencyCode,
        label: baseCurrencyCode.toUpperCase(),
    };
};

export const getSupportedFiatCurrencyWithFallback = (currencyCode: string): FiatCurrencyCode => {
    if (isSupportedFiatCurrency(currencyCode)) {
        return currencyCode;
    }

    return DEFAULT_FIAT_CURRENCY_FALLBACK;
};
