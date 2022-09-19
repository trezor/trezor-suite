import React, { createContext, useMemo } from 'react';

import {
    prepareCryptoAmountFormatter,
    CryptoAmountFormatterDataContext,
    CryptoAmountFormatterInputValue,
    CryptoAmountStructuredOutput,
    CryptoAmountFormatterOutputType,
} from './kinds/prepareCryptoAmountFormatter';
import { Formatter } from './makeFormatter';
import { FormatterConfig } from './types';

type FormatterProviderProps = {
    children: React.ReactNode;
    config: FormatterConfig;
};

export type Formatters = {
    cryptoAmountFormatter: Formatter<
        CryptoAmountFormatterInputValue,
        CryptoAmountFormatterOutputType,
        string,
        CryptoAmountStructuredOutput,
        CryptoAmountFormatterDataContext
    >;
};

export const FormatterProviderContext = createContext<Formatters>({} as Formatters);

export const FormatterProvider = ({ config, children }: FormatterProviderProps) => {
    const contextValue = useMemo(
        () => ({
            cryptoAmountFormatter: prepareCryptoAmountFormatter(config),
        }),
        [config],
    );

    return (
        <FormatterProviderContext.Provider value={contextValue}>
            {children}
        </FormatterProviderContext.Provider>
    );
};
