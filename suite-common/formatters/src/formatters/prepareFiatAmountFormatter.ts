import BigNumber from 'bignumber.js';
import { FormatNumberOptions } from '@formatjs/intl';

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
    >((value, dataContext) => {
        const { intl } = config;
        const { style, currency, minimumFractionDigits, maximumFractionDigits } = dataContext;
        const fiatValue = new BigNumber(value);

        if (fiatValue.isNaN()) {
            return null;
        }

        if (fiatValue.gt(Number.MAX_SAFE_INTEGER)) {
            return `${value} ${currency}`;
        }

        return intl.formatNumber(fiatValue.toNumber(), {
            ...dataContext,
            style: style || 'currency',
            minimumFractionDigits: minimumFractionDigits ?? 2,
            maximumFractionDigits: maximumFractionDigits ?? 2,
        });
    });
