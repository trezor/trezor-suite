import { FormatNumberOptions } from '@formatjs/intl';

import { BaseCurrencyAmount, redactNumericalSubstring } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';

const USE_SIGNIFICANT_DIGITS_BELOW = 1000;
const MAX_NO_SIGNIFICANT_DIGITS = Math.log10(USE_SIGNIFICANT_DIGITS_BELOW);

export type BaseCurrencyAmountFormatterDataContext<T> = {
    [K in keyof T]: T[K];
};

const handleBigNumberFormatting = (
    value: BaseCurrencyAmount,
    dataContext: BaseCurrencyAmountFormatterDataContext<FormatNumberOptions>,
    config: FormatterConfig,
) => {
    const { intl, baseCurrency } = config;
    const { style, currency, minimumFractionDigits, maximumFractionDigits } = dataContext;
    const baseCurrencyValue = new BigNumber(value);
    const currencyForDisplay = currency ?? baseCurrency;

    if (baseCurrencyValue.gt(Number.MAX_VALUE)) {
        // backup when number is too big, the formatting is different from what should be for currencies
        return `${value} ${currencyForDisplay}`;
    }

    const useSignificantDigits = baseCurrencyValue.isLessThan(USE_SIGNIFICANT_DIGITS_BELOW);

    return intl.formatNumber(baseCurrencyValue.toNumber(), {
        ...dataContext,
        style: style || 'currency',
        currency: currencyForDisplay,
        ...(useSignificantDigits
            ? {
                  minimumSignificantDigits: 1,
                  maximumSignificantDigits:
                      MAX_NO_SIGNIFICANT_DIGITS + (maximumFractionDigits ?? 2),
              }
            : {
                  minimumFractionDigits: minimumFractionDigits ?? 0,
                  maximumFractionDigits: maximumFractionDigits ?? 2,
              }),
    });
};

export const prepareBaseCurrencyAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<
        BaseCurrencyAmount,
        string | null,
        BaseCurrencyAmountFormatterDataContext<FormatNumberOptions>
    >((value, dataContext, shouldRedactNumbers) => {
        const baseValue = new BigNumber(value);
        if (baseValue.isNaN()) {
            return null;
        }

        const formattedValue = handleBigNumberFormatting(value, dataContext, config);

        return shouldRedactNumbers ? redactNumericalSubstring(formattedValue) : formattedValue;
    }, 'BaseCurrencyAmountFormatter');
