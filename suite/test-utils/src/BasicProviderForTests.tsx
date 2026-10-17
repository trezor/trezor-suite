import type { PropsWithChildren } from 'react';

import { MockedFormatterProvider } from '@suite-common/formatters/mocks';
import { IntlProviderForTests } from '@suite-lego/intl';
import { ServicesProvider } from '@trezor/dependency-injection';
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
