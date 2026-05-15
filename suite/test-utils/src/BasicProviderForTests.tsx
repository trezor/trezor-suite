import type { PropsWithChildren } from 'react';

import { IntlProviderForTests } from '@suite/intl';
import { ServicesProvider } from '@suite-common/dependency-injection';
import { MockedFormatterProvider } from '@suite-common/formatters';
import { ConnectedThemeProvider, ResponsiveContextProvider } from '@trezor/suite';
// TODO fix deep import
// eslint-disable-next-line local-rules/no-package-deep-imports
import { extraDependenciesDesktopMock } from '@trezor/suite/src/support/tests/extraDependenciesDesktop.mock';

export const BasicProviderForTests = ({ children }: PropsWithChildren) => (
    <ServicesProvider services={extraDependenciesDesktopMock.services}>
        <ConnectedThemeProvider>
            <ResponsiveContextProvider>
                <IntlProviderForTests>
                    <MockedFormatterProvider>{children}</MockedFormatterProvider>
                </IntlProviderForTests>
            </ResponsiveContextProvider>
        </ConnectedThemeProvider>
    </ServicesProvider>
);
