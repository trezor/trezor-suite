import { type PropsWithChildren, useMemo, useState } from 'react';

import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';

import { IntlProviderForTests } from '@suite/intl';
import { ServicesProvider } from '@suite-common/dependency-injection';
import { MockedFormatterProvider } from '@suite-common/formatters/mocks';
import { ConnectedThemeProvider, ResponsiveContextProvider } from '@trezor/suite';

type BasicProviderForTestsProps = PropsWithChildren<{ services?: object }>;

export const BasicProviderForTests = ({ children, services }: BasicProviderForTestsProps) => {
    const [networks] = useState(mockNetworkConfigDeps);
    const selectedServices = useMemo(
        () => ({
            ...services,
            networks: { ...networks, ...(services as { networks?: object } | undefined)?.networks },
        }),
        [networks, services],
    );

    return (
        <ServicesProvider services={selectedServices}>
            <ConnectedThemeProvider>
                <ResponsiveContextProvider>
                    <IntlProviderForTests>
                        <MockedFormatterProvider>{children}</MockedFormatterProvider>
                    </IntlProviderForTests>
                </ResponsiveContextProvider>
            </ConnectedThemeProvider>
        </ServicesProvider>
    );
};
