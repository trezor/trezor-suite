import React, { createContext, useMemo } from 'react';
import { useIntl } from 'react-intl';

import { FormatterConfig, Formatters } from './types';
import { prepareCryptoAmountFormatter } from './generators';

type FormatterProviderProps = {
    children: React.ReactNode;
    config: FormatterConfig;
};

export const FormatterProviderContext = createContext<Formatters>({} as Formatters);

export const FormatterProvider = ({ config, children }: FormatterProviderProps) => {
    const intl = useIntl();

    const contextValue = useMemo(
        () => ({
            cryptoAmountFormatter: prepareCryptoAmountFormatter(config),
        }),
        [config, intl],
    );

    return (
        <FormatterProviderContext.Provider value={contextValue}>
            {children}
        </FormatterProviderContext.Provider>
    );
};
