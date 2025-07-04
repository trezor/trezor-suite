import { FormatNumberOptions } from '@formatjs/intl';

import { redactNumericalSubstring } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';

export type FiatAmountFormatterDataContext<T> = {
    [K in keyof T]: T[K];
};

const handleBigNumberFormatting = (
    value: string | number | BigNumber,
    dataContext: FiatAmountFormatterDataContext<FormatNumberOptions>,
    config: FormatterConfig,
) => {
    const { intl, baseCurrency } = config;
    const { style, currency, minimumFractionDigits, maximumFractionDigits } = dataContext;
    const baseCurrencyValue = new BigNumber(value);
    const currencyForDisplay = currency ?? baseCurrency;

    if (baseCurrencyValue.gt(Number.MAX_VALUE)) {
        // backup when number is too big, the formatting is different from what should be for currencies
        return `${value instanceof BigNumber ? value.toFixed() : value} ${currencyForDisplay}`;
    }

    return intl.formatNumber(baseCurrencyValue.toNumber(), {
        ...dataContext,
        style: style || 'currency',
        currency: currencyForDisplay,
        minimumFractionDigits: minimumFractionDigits ?? 2,
        maximumFractionDigits: maximumFractionDigits ?? 2,
    });
};

export const prepareBaseCurrencyAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<
        string | number | BigNumber,
        string | null,
        FiatAmountFormatterDataContext<FormatNumberOptions>
    >((value, dataContext, shouldRedactNumbers) => {
        const baseValue = new BigNumber(value);
        if (baseValue.isNaN()) {
            return null;
        }

        const formattedValue = handleBigNumberFormatting(value, dataContext, config);

        return shouldRedactNumbers ? redactNumericalSubstring(formattedValue) : formattedValue;
    }, 'BaseCurrencyAmountFormatter');
