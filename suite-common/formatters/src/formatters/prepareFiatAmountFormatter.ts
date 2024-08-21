import { FormatNumberOptions } from '@formatjs/intl';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import { redactNumericalSubstring } from '@suite-common/wallet-utils';

import { makeFormatter } from '../makeFormatter';
import { FormatterConfig } from '../types';

export type FiatAmountFormatterDataContext<T> = {
    [K in keyof T]: T[K];
};

export const prepareFiatAmountFormatter = (config: FormatterConfig) =>
    makeFormatter<
        string | number,
        string | null,
        FiatAmountFormatterDataContext<FormatNumberOptions>
    >((value, dataContext, shouldRedactNumbers) => {
        const { intl, fiatCurrency } = config;

        const { style, currency, minimumFractionDigits, maximumFractionDigits } = dataContext;
        const fiatValue = new BigNumber(value);
        const currencyForDisplay = currency ?? fiatCurrency;

        if (fiatValue.isNaN()) {
            return null;
        }

        let formattedValue: string = '';

        if (fiatValue.gt(Number.MAX_SAFE_INTEGER)) {
            formattedValue = `${value} ${currencyForDisplay}`;
        }

        formattedValue = intl.formatNumber(fiatValue.toNumber(), {
            ...dataContext,
            style: style || 'currency',
            currency: currencyForDisplay,
            minimumFractionDigits: minimumFractionDigits ?? 2,
            maximumFractionDigits: maximumFractionDigits ?? 2,
        });

        return shouldRedactNumbers ? redactNumericalSubstring(formattedValue) : formattedValue;
    }, 'FiatAmountFormatter');
