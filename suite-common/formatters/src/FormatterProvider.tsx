import React, { createContext, useMemo } from 'react';

import { SignValue } from '@suite-common/suite-types';

import {
    prepareCryptoAmountFormatter,
    CryptoAmountFormatterDataContext,
    CryptoAmountFormatterInputValue,
} from './kinds/prepareCryptoAmountFormatter';
import { prepareCoinBalanceFormatter } from './kinds/prepareCoinBalanceFormatter';
import { Formatter } from './makeFormatter';
import { FormatterConfig } from './types';
import { signValueFormatter } from './kinds/signValueFormatter';
import { prepareCurrencySymbolFormatter } from './kinds/prepareCurrencySymbolFormatter';

type FormatterProviderProps = {
    children: React.ReactNode;
    config: FormatterConfig;
};

export type Formatters = {
    cryptoAmountFormatter: Formatter<
        CryptoAmountFormatterInputValue,
        string,
        never,
        CryptoAmountFormatterDataContext
    >;
    coinBalanceFormatter: Formatter<string, string>;
    currencySymbolFormatter: Formatter<string, string>;
    signValueFormatter: Formatter<SignValue | undefined, string>;
};

export const FormatterProviderContext = createContext<Formatters>({} as Formatters);

export const FormatterProvider = ({ config, children }: FormatterProviderProps) => {
    const contextValue = useMemo(
        () => ({
            cryptoAmountFormatter: prepareCryptoAmountFormatter(config),
            coinBalanceFormatter: prepareCoinBalanceFormatter(config),
            currencySymbolFormatter: prepareCurrencySymbolFormatter(config),
            signValueFormatter,
        }),
        [config],
    );

    return (
        <FormatterProviderContext.Provider value={contextValue}>
            {children}
        </FormatterProviderContext.Provider>
    );
};
