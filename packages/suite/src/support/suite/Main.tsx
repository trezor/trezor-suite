import { HelmetProvider } from 'react-helmet-async';

import { useServices } from '@suite-common/dependency-injection';
import { ReactQueryProvider } from '@suite-common/react-query/src/components/ReactQueryProvider';
import { injectStore } from '@suite-common/redux-utils/src/storeInjectors';
import { SelectCacheProvider } from '@trezor/components';
import { NetworkDisplayProvider } from '@trezor/product-components/network-display';

import Autodetect from 'src/support/suite/Autodetect';
import { ConnectedIntlProvider } from 'src/support/suite/ConnectedIntlProvider';
import { ConnectedThemeProvider } from 'src/support/suite/ConnectedThemeProvider';
import { ErrorBoundary } from 'src/support/suite/ErrorBoundary';
import OnlineStatus from 'src/support/suite/OnlineStatus';
import Protocol from 'src/support/suite/Protocol';
import Resize from 'src/support/suite/Resize';
import { ResponsiveContextProvider } from 'src/support/suite/ResponsiveContext';

import { ConnectPopupModals } from './ConnectPopupModals';
import { ConnectedFormatterProvider } from './ConnectedFormatterProvider';
import { RouterHandler } from './RouterHandler';

export const Main = ({
    trafficLightOffset,
    children,
}: {
    trafficLightOffset?: React.ReactNode;
    children: React.ReactNode;
}) => {
    const { store } = useServices(injectStore);

    return (
        // Todo: Enable when issues are fixed (ReactTruncate & BumpFee)
        // <StrictMode>
        <NetworkDisplayProvider store={store}>
            <HelmetProvider>
                {trafficLightOffset ?? null}
                <ConnectPopupModals />
                <ConnectedThemeProvider>
                    <ResponsiveContextProvider>
                        <ErrorBoundary>
                            <ReactQueryProvider>
                                <Autodetect />
                                <Resize />
                                <Protocol />
                                <OnlineStatus />
                                <RouterHandler />
                                <ConnectedIntlProvider>
                                    <SelectCacheProvider>
                                        <ConnectedFormatterProvider>
                                            {children}
                                        </ConnectedFormatterProvider>
                                    </SelectCacheProvider>
                                </ConnectedIntlProvider>
                            </ReactQueryProvider>
                        </ErrorBoundary>
                    </ResponsiveContextProvider>
                </ConnectedThemeProvider>
            </HelmetProvider>
        </NetworkDisplayProvider>
        // </StrictMode>
    );
};
