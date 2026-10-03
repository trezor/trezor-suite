import { type PropsWithChildren, useState } from 'react';

import { IntlProviderForTests } from '@suite/intl';
import { ServicesProvider, mock } from '@suite-common/dependency-injection';
import { MockedFormatterProvider } from '@suite-common/formatters/mocks';
import {
    createNetworkIconRegistry,
    createNetworkModuleRepository,
    createNetworkModulesCompositionRoot,
} from '@suite-common/networks';
import { ConnectedThemeProvider, ResponsiveContextProvider } from '@trezor/suite';

type BasicProviderForTestsProps = PropsWithChildren<{ services?: object }>;

export const BasicProviderForTests = ({ children, services = {} }: BasicProviderForTestsProps) => {
    const [networkIconRegistry] = useState(() =>
        createNetworkIconRegistry({
            networkModuleRepository: createNetworkModuleRepository({
                networkModules: createNetworkModulesCompositionRoot({ getTrezorConnect: mock() }),
            }),
        }),
    );

    return (
        <ServicesProvider services={{ networkIconRegistry, ...services }}>
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
