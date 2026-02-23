import type { PropsWithChildren } from 'react';

import { IntlProviderForTests } from '@suite/intl';
import { MockedFormatterProvider } from '@suite-common/formatters';
import {
    ConnectedThemeProvider,
    ResponsiveContextProvider,
    SuiteServicesProvider,
} from '@trezor/suite';
// TODO fix deep import
// eslint-disable-next-line local-rules/no-package-deep-imports
import { extraDependenciesDesktopMock } from '@trezor/suite/src/support/tests/extraDependenciesDesktop.mock';

export const BasicProviderForTests = ({ children }: PropsWithChildren) => (
    <SuiteServicesProvider services={extraDependenciesDesktopMock.services}>
        <ConnectedThemeProvider>
            <ResponsiveContextProvider>
                <IntlProviderForTests>
                    <MockedFormatterProvider>{children}</MockedFormatterProvider>
                </IntlProviderForTests>
            </ResponsiveContextProvider>
        </ConnectedThemeProvider>
    </SuiteServicesProvider>
);
