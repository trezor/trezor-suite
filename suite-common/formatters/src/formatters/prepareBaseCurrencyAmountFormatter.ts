import { FormatNumberOptions } from '@formatjs/intl';

import {
    BaseCurrencyAmount,
    asAmountUnit,
    asBaseCurrencyAmount,
    redactNumericalSubstring,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';

export type BaseCurrencyAmountFormatterDataContext<T> = {
    [K in keyof T]: T[K];
};

// `currency` param in intl.formatNumber works only wit 3 letter currencies
const BITCOIN_SATS_PLACEHOLDER = 'sat';

const handleBigNumberFormatting = (
    value: BaseCurrencyAmount,
    dataContext: BaseCurrencyAmountFormatterDataContext<FormatNumberOptions>,
    config: FormatterConfig,
) => {
    const { intl, baseCurrency, bitcoinAmountUnit } = config;
    const {
        style: styleFromContext,
        currency: currencyFromContext,
        minimumFractionDigits,
        maximumFractionDigits,
    } = dataContext;
    const currency = currencyFromContext ?? baseCurrency;

    const isSats =
        currency.toLowerCase() === 'btc' && bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;

    const currencyForDisplay = isSats ? BITCOIN_SATS_PLACEHOLDER : currency;
    const baseCurrencyValue = isSats ? unitsToSubunits(asAmountUnit(value, 'btc'), 'btc') : value;

    if (baseCurrencyValue.gt(Number.MAX_VALUE)) {
        // backup when number is too big, the formatting is different from what should be for currencies
        return `${value} ${currencyForDisplay}`;
    }

    const formatted = intl.formatNumber(baseCurrencyValue.toNumber(), {
        ...dataContext,
        style: styleFromContext || 'currency',
        currency: currencyForDisplay,
        minimumFractionDigits:
            currencyForDisplay === BITCOIN_SATS_PLACEHOLDER ? 0 : (minimumFractionDigits ?? 2),
        maximumFractionDigits:
            currencyForDisplay === BITCOIN_SATS_PLACEHOLDER ? 0 : (maximumFractionDigits ?? 2),
    });

    return currencyForDisplay === BITCOIN_SATS_PLACEHOLDER
        ? formatted.replace(BITCOIN_SATS_PLACEHOLDER.toUpperCase(), 'Sats')
        : formatted;
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
