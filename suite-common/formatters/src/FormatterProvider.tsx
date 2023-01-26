import React, { createContext, useMemo } from 'react';
import { useIntl } from 'react-intl';

import { FormatNumberOptions } from '@formatjs/intl';

import { SignValue } from '@suite-common/suite-types';
import { NetworkSymbol } from '@suite-common/wallet-config';

import {
    CryptoAmountFormatterDataContext,
    CryptoAmountFormatterInputValue,
    prepareCryptoAmountFormatter,
} from './formatters/prepareCryptoAmountFormatter';
import { prepareCoinBalanceFormatter } from './formatters/prepareCoinBalanceFormatter';
import {
    FiatAmountFormatterDataContext,
    prepareFiatAmountFormatter,
} from './formatters/prepareFiatAmountFormatter';
import { Formatter } from './makeFormatter';
import { FormatterConfig, FormatterProviderConfig } from './types';
import { SignValueFormatter } from './formatters/SignValueFormatter';
import { prepareCurrencySymbolFormatter } from './formatters/prepareCurrencySymbolFormatter';
import { prepareDateFormatter } from './formatters/prepareDateFormatters';
import { prepareTimeFormatter } from './formatters/prepareTimeFormatter';
import { prepareDateTimeFormatter } from './formatters/prepareDateTimeFormatter';

type FormatterProviderProps = {
    children: React.ReactNode;
    config: FormatterProviderConfig;
};

export type Formatters = {
    CryptoAmountFormatter: Formatter<
        CryptoAmountFormatterInputValue,
        string,
        CryptoAmountFormatterDataContext
    >;
    CoinBalanceFormatter: Formatter<string, string>;
    CurrencySymbolFormatter: Formatter<NetworkSymbol, string>;
    SignValueFormatter: Formatter<SignValue | undefined, string>;
    FiatAmountFormatter: Formatter<
        string | number,
        string | null,
        FiatAmountFormatterDataContext<FormatNumberOptions>
    >;
    DateFormatter: Formatter<Date | number, string>;
    TimeFormatter: Formatter<Date | number, string>;
    DateTimeFormatter: Formatter<Date | number | null, string | null>;
};

export const FormatterProviderContext = createContext<Formatters>({} as Formatters);

export const getFormatters = (config: FormatterConfig): Formatters => {
    const CryptoAmountFormatter = prepareCryptoAmountFormatter(config);
    const CoinBalanceFormatter = prepareCoinBalanceFormatter(config);
    const CurrencySymbolFormatter = prepareCurrencySymbolFormatter(config);
    const FiatAmountFormatter = prepareFiatAmountFormatter(config);
    const DateFormatter = prepareDateFormatter(config);
    const TimeFormatter = prepareTimeFormatter(config);
    const DateTimeFormatter = prepareDateTimeFormatter(config);

    return {
        CryptoAmountFormatter,
        CoinBalanceFormatter,
        CurrencySymbolFormatter,
        FiatAmountFormatter,
        DateFormatter,
        SignValueFormatter,
        TimeFormatter,
        DateTimeFormatter,
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
