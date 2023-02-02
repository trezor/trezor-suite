import React from 'react';
import { useIntl } from 'react-intl';

import { PROTO } from '@trezor/connect';

import { FormatterProviderContext, getFormatters } from '../FormatterProvider';

type MockedFormatterProviderProps = {
    children: React.ReactNode;
};

export const MockedFormatterProvider = ({ children }: MockedFormatterProviderProps) => {
    const intl = useIntl();

    const formatters = getFormatters({
        locale: 'en',
        fiatCurrency: 'usd',
        bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
        intl,
    });

    return (
        <FormatterProviderContext.Provider value={formatters}>
            {children}
        </FormatterProviderContext.Provider>
    );
};
