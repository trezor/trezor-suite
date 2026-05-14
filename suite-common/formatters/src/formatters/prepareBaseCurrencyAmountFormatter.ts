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

const formatStandard = ({ intl, currency, value, dataContext }: FormatParams) => {
    if (value.gt(Number.MAX_VALUE)) {
        // backup when number is too big, the formatting is different from what should be for currencies
        return `${value} ${currency}`;
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
        ? `${result.replace(/BTC|btc/, '').trim()} ${currency.toUpperCase()}`
        : result;
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
