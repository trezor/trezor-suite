import type { PropsWithChildren } from 'react';

import { IntlProviderForTests } from '@suite/intl';
import { ServicesProvider } from '@suite-common/dependency-injection';
import { MockedFormatterProvider } from '@suite-common/formatters/mocks';
import { ConnectedThemeProvider, ResponsiveContextProvider } from '@trezor/suite';

type BasicProviderForTestsProps = PropsWithChildren<{ services?: object }>;

export const BasicProviderForTests = ({ children, services = {} }: BasicProviderForTestsProps) => (
    <ServicesProvider services={services}>
        <ConnectedThemeProvider>
            <ResponsiveContextProvider>
                <IntlProviderForTests>
                    <MockedFormatterProvider>{children}</MockedFormatterProvider>
                </IntlProviderForTests>
            </ResponsiveContextProvider>
        </ConnectedThemeProvider>
    </ServicesProvider>
);
