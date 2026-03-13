import { ReactNode, createContext, useMemo } from 'react';
import { useIntl } from 'react-intl';

import type { FormatNumberOptions } from '@formatjs/intl';

import type { SignValue } from '@suite-common/suite-types';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { BaseCurrencyAmount } from '@suite-common/wallet-types';

import { NetworkNameFormatter } from './formatters/NetworkNameFormatter';
import { SignValueFormatter } from './formatters/SignValueFormatter';
import {
    type BaseCurrencyAmountFormatterDataContext,
    prepareBaseCurrencyAmountFormatter,
} from './formatters/prepareBaseCurrencyAmountFormatter';
import {
    type CryptoAmountFormatterDataContext,
    type CryptoAmountFormatterInputValue,
    prepareCryptoAmountFormatter,
} from './formatters/prepareCryptoAmountFormatter';
import { prepareDateFormatter } from './formatters/prepareDateFormatter';
import { prepareDateTimeFormatter } from './formatters/prepareDateTimeFormatter';
import {
    type DisplaySymbolFormatterDataContext,
    prepareDisplaySymbolFormatter,
} from './formatters/prepareDisplaySymbolFormatter';
import { MonthNameFormatter } from './formatters/prepareMonthNameFormatter';
import { prepareTimeFormatter } from './formatters/prepareTimeFormatter';
import type { Formatter } from './makeFormatter';
import type { FormatterConfig, FormatterProviderConfig } from './types';

type FormatterProviderProps = {
    children: ReactNode;
    config: FormatterProviderConfig;
};

export type Formatters = {
    CryptoAmountFormatter: Formatter<
        CryptoAmountFormatterInputValue,
        string,
        CryptoAmountFormatterDataContext
    >;
    DisplaySymbolFormatter: Formatter<NetworkSymbol, string, DisplaySymbolFormatterDataContext>;
    NetworkNameFormatter: Formatter<NetworkSymbol, string>;
    SignValueFormatter: Formatter<SignValue | undefined, string>;
    BaseCurrencyAmountFormatter: Formatter<
        BaseCurrencyAmount,
        string | null,
        BaseCurrencyAmountFormatterDataContext<FormatNumberOptions>
    >;
    DateFormatter: Formatter<Date | number, string>;
    TimeFormatter: Formatter<Date | number, string>;
    DateTimeFormatter: Formatter<Date | number | null, string | null>;
    MonthNameFormatter: Formatter<Date, string>;
};

export const FormatterProviderContext = createContext<Formatters>({} as Formatters);

export const getFormatters = (config: FormatterConfig): Formatters => {
    const CryptoAmountFormatter = prepareCryptoAmountFormatter(config);
    const DisplaySymbolFormatter = prepareDisplaySymbolFormatter(config);
    const BaseCurrencyAmountFormatter = prepareBaseCurrencyAmountFormatter(config);
    const DateFormatter = prepareDateFormatter(config);
    const TimeFormatter = prepareTimeFormatter(config);
    const DateTimeFormatter = prepareDateTimeFormatter(config);

    return {
        CryptoAmountFormatter,
        DisplaySymbolFormatter,
        NetworkNameFormatter,
        BaseCurrencyAmountFormatter,
        DateFormatter,
        SignValueFormatter,
        TimeFormatter,
        DateTimeFormatter,
        MonthNameFormatter,
    };
};

export const FormatterProvider = ({ config, children }: FormatterProviderProps) => {
    const intl = useIntl();

    const contextValue = useMemo(() => {
        const extendedConfig = {
            ...config,
            intl,
        };

        return getFormatters(extendedConfig);
    }, [config, intl]);

    return (
        <FormatterProviderContext.Provider value={contextValue}>
            {children}
        </FormatterProviderContext.Provider>
    );
};
