import React, { createContext, useMemo } from 'react';

import { FormatNumberOptions } from '@formatjs/intl';

import { SignValue } from '@suite-common/suite-types';

import {
    prepareCryptoAmountFormatter,
    CryptoAmountFormatterDataContext,
    CryptoAmountFormatterInputValue,
} from './kinds/prepareCryptoAmountFormatter';
import { prepareCoinBalanceFormatter } from './kinds/prepareCoinBalanceFormatter';
import {
    prepareFiatAmountFormatter,
    FiatAmountFormatterDataContext,
} from './kinds/prepareFiatAmountFormatter';
import { Formatter } from './makeFormatter';
import { FormatterConfig } from './types';
import { SignValueFormatter } from './kinds/SignValueFormatter';
import { prepareCurrencySymbolFormatter } from './kinds/prepareCurrencySymbolFormatter';

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
    CurrencySymbolFormatter: Formatter<string, string>;
    SignValueFormatter: Formatter<SignValue | undefined, string>;
    FiatAmountFormatter: Formatter<
        string | number,
        string | null,
        FiatAmountFormatterDataContext<FormatNumberOptions>
    >;
};

export const FormatterProviderContext = createContext<Formatters>({} as Formatters);

export const FormatterProvider = ({ config, children }: FormatterProviderProps) => {
    const contextValue = useMemo(
        () => ({
            CryptoAmountFormatter: prepareCryptoAmountFormatter(config),
            CoinBalanceFormatter: prepareCoinBalanceFormatter(config),
            CurrencySymbolFormatter: prepareCurrencySymbolFormatter(config),
            FiatAmountFormatter: prepareFiatAmountFormatter(config),
            SignValueFormatter,
        }),
        [config],
    );

    return (
        <FormatterProviderContext.Provider value={contextValue}>
            {children}
        </FormatterProviderContext.Provider>
    );
};
