import { type ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';
import { PROTO } from '@trezor/connect';

import { FormatterProviderContext, getFormatters } from '../src/FormatterProvider';

const networkConfigDeps = mockNetworkConfigDeps();

type MockedFormatterProviderProps = {
    children: ReactNode;
};

export const MockedFormatterProvider = ({ children }: MockedFormatterProviderProps) => {
    const intl = useIntl();

    const formatters = getFormatters(networkConfigDeps, {
        locale: 'en',
        baseCurrency: 'usd',
        bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
        intl,
        is24HourFormat: true,
    });

    return (
        <FormatterProviderContext.Provider value={formatters}>
            {children}
        </FormatterProviderContext.Provider>
    );
};
