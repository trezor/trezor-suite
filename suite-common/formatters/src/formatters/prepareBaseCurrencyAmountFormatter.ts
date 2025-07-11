import { IntlShape } from 'react-intl';

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

type FormatParams = {
    value: BaseCurrencyAmount;
    currency: string;
    intl: IntlShape;
    dataContext: Omit<BaseCurrencyAmountFormatterDataContext<FormatNumberOptions>, 'currency'>;
};

const formatSats = ({ intl, dataContext, value }: FormatParams) => {
    const currencyForDisplay = BITCOIN_SATS_PLACEHOLDER;
    const baseCurrencyValue = unitsToSubunits(asAmountUnit(value, 'btc'), 'btc');

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

    return `${formatted.replace(BITCOIN_SATS_PLACEHOLDER.toUpperCase(), '')} sat`;
};

const formatStandard = ({ intl, currency, value, dataContext }: FormatParams) => {
    if (value.gt(Number.MAX_VALUE)) {
        // backup when number is too big, the formatting is different from what should be for currencies
        return `${value} ${currency}`;
    }

    const { minimumFractionDigits, maximumFractionDigits, style } = dataContext;

    return intl.formatNumber(value.toNumber(), {
        ...dataContext,
        style: style || 'currency',
        currency,
        minimumFractionDigits: minimumFractionDigits ?? 2,
        maximumFractionDigits: maximumFractionDigits ?? 2,
    });
};

const handleBigNumberFormatting = (
    value: BaseCurrencyAmount,
    dataContext: BaseCurrencyAmountFormatterDataContext<FormatNumberOptions>,
    config: FormatterConfig,
) => {
    const { intl, baseCurrency, bitcoinAmountUnit } = config;
    const { currency: currencyFromContext } = dataContext;
    const currency = currencyFromContext ?? baseCurrency;

    const isSats =
        currency.toLowerCase() === 'btc' && bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;

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
