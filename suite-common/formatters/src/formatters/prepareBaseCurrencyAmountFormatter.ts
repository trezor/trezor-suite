import { IntlShape } from 'react-intl';

import { FormatNumberOptions } from '@formatjs/intl';

import { BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import {
    asAmountUnit,
    isBaseCurrencyWithSats,
    redactNumericalSubstring,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { PROTO } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';

export type BaseCurrencyAmountFormatterDataContext<T> = {
    [K in keyof T]: T[K];
} & { skipShortFormat?: boolean };

// `currency` param in intl.formatNumber works only wit 3 letter currencies
const BITCOIN_SATS_PLACEHOLDER = 'sat';
const FIAT_AMOUNT_CURRENCY_NBSP = '\u00A0'; // non-breaking space between amount and currency

type FormatParams = {
    value: BaseCurrencyAmount;
    currency: string;
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

const THOUSAND = 1e3;
const MILLION = 1e6;
const BILLION = 1e9;
const TRILLION = 1e12;

type ShortFiatSuffix = 'K' | 'M' | 'B' | 'T';

const getShortFiatParts = (
    value: BaseCurrencyAmount,
): { shortValue: number; suffix: ShortFiatSuffix } | null => {
    const n = value.toNumber();
    if (n >= TRILLION) {
        return { shortValue: n / TRILLION, suffix: 'T' };
    }
    if (n >= BILLION) {
        return { shortValue: n / BILLION, suffix: 'B' };
    }
    if (n >= MILLION) {
        return { shortValue: n / MILLION, suffix: 'M' };
    }
    if (n >= THOUSAND) {
        return { shortValue: n / THOUSAND, suffix: 'K' };
    }

    return null;
};

const formatShortFiat = ({
    intl,
    currency,
    value,
}: Omit<FormatParams, 'dataContext'> & { dataContext?: FormatParams['dataContext'] }) => {
    const parts = getShortFiatParts(value);
    if (!parts) return null;

    const { shortValue, suffix } = parts;

    // Use same locale-aware formatting as formatStandard: number + suffix + currency (symbol/code per locale)
    const partsArray = intl.formatNumberToParts(shortValue, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    const numberPartTypes = ['integer', 'group', 'decimal', 'fraction'] as const;
    const numberParts: string[] = [];
    let currencyPartValue = '';

    for (const p of partsArray) {
        if (numberPartTypes.includes(p.type as (typeof numberPartTypes)[number])) {
            const val = p.value as string;
            numberParts.push(p.type === 'fraction' ? val.replace(/0+$/, '') : val);
        } else if (p.type === 'currency') {
            currencyPartValue = p.value as string;
        }
    }

    const numberStr = numberParts.join('').replace(/[.,]$/, '');
    const currencyDisplay = currencyPartValue || currency.toUpperCase();

    return `${numberStr}${suffix}${FIAT_AMOUNT_CURRENCY_NBSP}${currencyDisplay}`;
};

const formatStandard = ({
    intl,
    currency,
    value,
    dataContext,
    useShortFiatFormat,
}: FormatParams & { useShortFiatFormat?: boolean }) => {
    if (value.gt(Number.MAX_VALUE)) {
        // backup when number is too big, the formatting is different from what should be for currencies
        return `${value}${FIAT_AMOUNT_CURRENCY_NBSP}${currency}`;
    }

    if (useShortFiatFormat && !dataContext.skipShortFormat) {
        const shortFormatted = formatShortFiat({ intl, currency, value, dataContext });
        if (shortFormatted !== null) {
            return shortFormatted;
        }
    }

    const { minimumFractionDigits, maximumFractionDigits, style } = dataContext;

    const result = intl.formatNumber(value.toNumber(), {
        ...dataContext,
        style: style || 'currency',
        currency,
        minimumFractionDigits: minimumFractionDigits ?? 2,
        maximumFractionDigits: maximumFractionDigits ?? 2,
    });

    return currency.toLowerCase() === 'btc' // In the case of Crypto Base-Currency, we always want to have currency ticker as suffix.
        ? `${result.replace(/BTC|btc/, '').trim()}${FIAT_AMOUNT_CURRENCY_NBSP}${currency.toUpperCase()}`
        : result;
};

const handleBigNumberFormatting = (
    value: BaseCurrencyAmount,
    dataContext: BaseCurrencyAmountFormatterDataContext<FormatNumberOptions>,
    config: FormatterConfig,
) => {
    const { intl, baseCurrency, bitcoinAmountUnit, useShortFiatFormat } = config;
    const { currency: currencyFromContext } = dataContext;
    const currency =
        (currencyFromContext !== undefined
            ? (currencyFromContext.toLowerCase() as BaseCurrencyCode) // 'react-intl' uses uppercase currencies
            : undefined) ?? baseCurrency;

    const isSats =
        isBaseCurrencyWithSats(currency) && bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;

    const formatParams: FormatParams = {
        intl,
        value,
        dataContext,
        currency,
    };

    return isSats
        ? formatSats(formatParams)
        : formatStandard({ ...formatParams, useShortFiatFormat });
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
