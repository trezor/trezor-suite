import React, { createContext, useMemo } from 'react';

import { FormatNumberOptions } from '@formatjs/intl';

import { SignValue } from '@suite-common/suite-types';
import { NetworkSymbol } from '@suite-common/wallet-config';

import {
    prepareCryptoAmountFormatter,
    CryptoAmountFormatterDataContext,
    CryptoAmountFormatterInputValue,
} from './formatters/prepareCryptoAmountFormatter';
import { prepareCoinBalanceFormatter } from './formatters/prepareCoinBalanceFormatter';
import {
    prepareFiatAmountFormatter,
    FiatAmountFormatterDataContext,
} from './formatters/prepareFiatAmountFormatter';
import { Formatter } from './makeFormatter';
import { FormatterConfig } from './types';
import { SignValueFormatter } from './formatters/SignValueFormatter';
import { prepareCurrencySymbolFormatter } from './formatters/prepareCurrencySymbolFormatter';

type FormatterProviderProps = {
    children: React.ReactNode;
    config: FormatterConfig;
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
};

export const FormatterProviderContext = createContext<Formatters>({} as Formatters);

export const getFormatters = (config: FormatterConfig): Formatters => {
    const CryptoAmountFormatter = prepareCryptoAmountFormatter(config);
    const CoinBalanceFormatter = prepareCoinBalanceFormatter(config);
    const CurrencySymbolFormatter = prepareCurrencySymbolFormatter(config);
    const FiatAmountFormatter = prepareFiatAmountFormatter(config);

    return {
        CryptoAmountFormatter,
        CoinBalanceFormatter,
        CurrencySymbolFormatter,
        FiatAmountFormatter,
        SignValueFormatter,
    };
};

export const FormatterProvider = ({ config, children }: FormatterProviderProps) => {
    const contextValue = useMemo(() => {
        const formatters = getFormatters(config);

        return formatters;
    }, [config]);

    return (
        <FormatterProviderContext.Provider value={contextValue}>
            {children}
        </FormatterProviderContext.Provider>
    );
};
