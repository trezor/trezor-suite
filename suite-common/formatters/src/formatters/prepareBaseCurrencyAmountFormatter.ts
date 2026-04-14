import { type IntlShape } from 'react-intl';

import { type FormatNumberOptions } from '@formatjs/intl';

import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import {
    asAmountUnit,
    isBaseCurrencyWithSats,
    redactNumericalSubstring,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { PROTO } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { makeFormatter } from '../makeFormatter';
import { type FormatterConfig } from '../types';

export type BaseCurrencyAmountFormatterDataContext<T> = {
    [K in keyof T]: T[K];
};

// `currency` param in intl.formatNumber works only wit 3 letter currencies
const BITCOIN_SATS_PLACEHOLDER = 'sat';

// Non-breaking space used between number and suffix currency symbol (matches CLDR standard for suffix currencies)
// eslint-disable-next-line no-irregular-whitespace
const SUFFIX_CURRENCY_SEPARATOR = ' ';

type FormatParams = {
    value: BaseCurrencyAmount;
    currency: string;
    locale: string;
    intl: IntlShape;
    dataContext: Omit<BaseCurrencyAmountFormatterDataContext<FormatNumberOptions>, 'currency'>;
};

const formatSats = ({ intl, dataContext, value }: FormatParams) => {
    const currencyForDisplay = BITCOIN_SATS_PLACEHOLDER;
    const baseCurrencyValue = unitsToSubunits({ value: asAmountUnit(value), symbol: 'btc' });

    if (baseCurrencyValue.gt(Number.MAX_VALUE)) {
        // backup when number is too big, the formatting is different from what should be for currencies
        return `${value} ${currencyForDisplay}`;
    }

    const formatted = intl.formatNumber(baseCurrencyValue.toNumber(), {
        ...dataContext,
        style: 'currency',
        currency: currencyForDisplay,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    // eslint-disable-next-line no-irregular-whitespace
    return `${formatted.replace(BITCOIN_SATS_PLACEHOLDER.toUpperCase(), '')} sat`.trim();
};

/**
 * Maps each supported fiat currency to its home locale, used to determine
 * the canonical (locale-independent) position of the currency symbol.
 */
const CURRENCY_HOME_LOCALE: Partial<Record<string, string>> = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    AED: 'ar-AE',
    ARS: 'es-AR',
    AUD: 'en-AU',
    BDT: 'bn-BD',
    BHD: 'ar-BH',
    BMD: 'en-BM',
    BRL: 'pt-BR',
    CAD: 'en-CA',
    CHF: 'de-CH',
    CLP: 'es-CL',
    CNY: 'zh-CN',
    CZK: 'cs-CZ',
    DKK: 'da-DK',
    HKD: 'zh-HK',
    HUF: 'hu-HU',
    IDR: 'id-ID',
    ILS: 'he-IL',
    INR: 'en-IN',
    JPY: 'ja-JP',
    KRW: 'ko-KR',
    KWD: 'ar-KW',
    LKR: 'si-LK',
    MMK: 'my-MM',
    MXN: 'es-MX',
    MYR: 'ms-MY',
    NOK: 'nb-NO',
    NZD: 'en-NZ',
    PHP: 'fil-PH',
    PKR: 'ur-PK',
    PLN: 'pl-PL',
    RUB: 'ru-RU',
    SAR: 'ar-SA',
    SEK: 'sv-SE',
    SGD: 'zh-SG',
    THB: 'th-TH',
    TRY: 'tr-TR',
    TWD: 'zh-TW',
    VEF: 'es-VE',
    VND: 'vi-VN',
    ZAR: 'en-ZA',
};

const isCurrencyCanonicallyPrefix = (currency: string): boolean => {
    const homeLocale = CURRENCY_HOME_LOCALE[currency.toUpperCase()] ?? 'en-US';
    const parts = new Intl.NumberFormat(homeLocale, {
        style: 'currency',
        currency,
    }).formatToParts(0);
    const currencyIdx = parts.findIndex(p => p.type === 'currency');
    const integerIdx = parts.findIndex(p => p.type === 'integer');

    return integerIdx !== -1 && currencyIdx < integerIdx;
};

const formatStandard = ({ intl, locale, currency, value, dataContext }: FormatParams) => {
    if (value.gt(Number.MAX_VALUE)) {
        // backup when number is too big, the formatting is different from what should be for currencies
        return `${value} ${currency}`;
    }

    const { minimumFractionDigits, maximumFractionDigits, style } = dataContext;

    const numberFormatOptions: Intl.NumberFormatOptions = {
        ...dataContext,
        style: style || 'currency',
        currency,
        minimumFractionDigits: minimumFractionDigits ?? 2,
        maximumFractionDigits: maximumFractionDigits ?? 2,
    };

    if (currency.toLowerCase() === 'btc') {
        // In the case of Crypto Base-Currency, we always want to have currency ticker as suffix.
        const result = intl.formatNumber(value.toNumber(), numberFormatOptions);

        return `${result.replace(/BTC|btc/, '').trim()} ${currency.toUpperCase()}`;
    }

    // Use formatToParts to ensure the currency symbol position matches the currency's
    // canonical convention (based on its home locale), regardless of the app locale.
    // e.g. USD is always prefix ($521), CZK is always suffix (521 Kč/CZK)
    const parts = new Intl.NumberFormat(locale, numberFormatOptions).formatToParts(value.toNumber());

    const currencyIndex = parts.findIndex(p => p.type === 'currency');

    if (currencyIndex === -1) {
        return parts.map(p => p.value).join('');
    }

    const firstIntegerIndex = parts.findIndex(p => p.type === 'integer');

    if (firstIntegerIndex === -1) {
        return parts.map(p => p.value).join('');
    }

    const canonicalIsPrefix = isCurrencyCanonicallyPrefix(currency);
    const currentIsPrefix = currencyIndex < firstIntegerIndex;

    if (currentIsPrefix === canonicalIsPrefix) {
        // Currency is already in canonical position, return as-is
        return parts.map(p => p.value).join('');
    }

    const currencyValue = parts[currencyIndex].value;
    const signString = parts
        .slice(0, firstIntegerIndex)
        .filter(p => p.type === 'minusSign' || p.type === 'plusSign')
        .map(p => p.value)
        .join('');

    if (canonicalIsPrefix) {
        // Currency is a suffix but should be a prefix (e.g. USD in cs-CZ: "521,00 US$" → "US$521,00")
        const numberParts = parts.filter((p, i) => {
            if (p.type === 'currency') return false;
            if (p.type === 'minusSign' || p.type === 'plusSign') return false;
            // Remove the whitespace literal immediately before the currency suffix
            if (p.type === 'literal' && i === currencyIndex - 1 && p.value.trim() === '') return false;

            return true;
        });

        return `${signString}${currencyValue}${numberParts.map(p => p.value).join('')}`;
    } else {
        // Currency is a prefix but should be a suffix (e.g. CZK in en-US: "CZK 521.00" → "521.00\u00a0CZK")
        const numberParts = parts.filter((p, i) => {
            if (p.type === 'currency') return false;
            if (p.type === 'minusSign' || p.type === 'plusSign') return false;
            // Remove the whitespace literal immediately after the currency prefix
            if (p.type === 'literal' && i === currencyIndex + 1 && p.value.trim() === '') return false;

            return true;
        });

        return `${signString}${numberParts.map(p => p.value).join('')}${SUFFIX_CURRENCY_SEPARATOR}${currencyValue}`;
    }
};

const handleBigNumberFormatting = (
    value: BaseCurrencyAmount,
    dataContext: BaseCurrencyAmountFormatterDataContext<FormatNumberOptions>,
    config: FormatterConfig,
) => {
    const { intl, baseCurrency, bitcoinAmountUnit } = config;
    const { currency: currencyFromContext } = dataContext;
    const currency =
        (currencyFromContext !== undefined
            ? (currencyFromContext.toLowerCase() as BaseCurrencyCode) // 'react-intl' uses uppercase currencies
            : undefined) ?? baseCurrency;

    const isSats =
        isBaseCurrencyWithSats(currency) && bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;

    const formatParams: FormatParams = {
        intl,
        locale: config.locale,
        value,
        dataContext,
        currency,
    };

    return isSats ? formatSats(formatParams) : formatStandard(formatParams);
};

export const prepareBaseCurrencyAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<
        BaseCurrencyAmount,
        string | null,
        BaseCurrencyAmountFormatterDataContext<FormatNumberOptions>
    >((value, dataContext, shouldRedactNumbers) => {
        // There is some place where `number` can leak here. I was not able to find out,
        // where it comes from.
        const fixedValue = asBaseCurrencyAmount(new BigNumber(value));

        if (fixedValue.isNaN()) {
            return null;
        }

        const formattedValue = handleBigNumberFormatting(fixedValue, dataContext, config);

        return shouldRedactNumbers ? redactNumericalSubstring(formattedValue) : formattedValue;
    }, 'BaseCurrencyAmountFormatter');
