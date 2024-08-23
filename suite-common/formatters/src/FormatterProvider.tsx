import { ReactNode, createContext, useMemo } from 'react';
import { useIntl } from 'react-intl';

import { FormatNumberOptions } from '@formatjs/intl';

import { SignValue } from '@suite-common/suite-types';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { NetworkNameFormatter } from './formatters/NetworkNameFormatter';
import { SignValueFormatter } from './formatters/SignValueFormatter';
import {
    CryptoAmountFormatterDataContext,
    CryptoAmountFormatterInputValue,
    prepareCryptoAmountFormatter,
} from './formatters/prepareCryptoAmountFormatter';
import { prepareDateFormatter } from './formatters/prepareDateFormatter';
import { prepareDateTimeFormatter } from './formatters/prepareDateTimeFormatter';
import {
    FiatAmountFormatterDataContext,
    prepareFiatAmountFormatter,
} from './formatters/prepareFiatAmountFormatter';
import { MonthNameFormatter } from './formatters/prepareMonthNameFormatter';
import {
    NetworkSymbolFormatterDataContext,
    prepareNetworkSymbolFormatter,
} from './formatters/prepareNetworkSymbolFormatter';
import { prepareTimeFormatter } from './formatters/prepareTimeFormatter';
import { Formatter } from './makeFormatter';
import { FormatterConfig, FormatterProviderConfig } from './types';

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
    NetworkSymbolFormatter: Formatter<NetworkSymbol, string, NetworkSymbolFormatterDataContext>;
    NetworkNameFormatter: Formatter<NetworkSymbol, string>;
    SignValueFormatter: Formatter<SignValue | undefined, string>;
    FiatAmountFormatter: Formatter<
        string | number,
        string | null,
        FiatAmountFormatterDataContext<FormatNumberOptions>
    >;
    DateFormatter: Formatter<Date | number, string>;
    TimeFormatter: Formatter<Date | number, string>;
    DateTimeFormatter: Formatter<Date | number | null, string | null>;
    MonthNameFormatter: Formatter<Date, string>;
};

export const FormatterProviderContext = createContext<Formatters>({} as Formatters);

export const getFormatters = (config: FormatterConfig): Formatters => {
    const CryptoAmountFormatter = prepareCryptoAmountFormatter(config);
    const NetworkSymbolFormatter = prepareNetworkSymbolFormatter(config);
    const FiatAmountFormatter = prepareFiatAmountFormatter(config);
    const DateFormatter = prepareDateFormatter(config);
    const TimeFormatter = prepareTimeFormatter(config);
    const DateTimeFormatter = prepareDateTimeFormatter(config);

    return {
        CryptoAmountFormatter,
        NetworkSymbolFormatter,
        NetworkNameFormatter,
        FiatAmountFormatter,
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
