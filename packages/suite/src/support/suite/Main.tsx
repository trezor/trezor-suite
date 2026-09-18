import { HelmetProvider } from 'react-helmet-async';
import { useStore } from 'react-redux';

import { selectNetworkNamesMap } from '@suite-common/networks/reduxState/networksSelectors';
import { ReactQueryProvider } from '@suite-common/react-query/src/components/ReactQueryProvider';
import { selectEnabledNetworks } from '@suite-common/wallet-core/src/settings/walletSettingsReducer';
import { SelectCacheProvider } from '@trezor/components';
import { NetworkDisplayStoreProvider } from '@trezor/product-components/network-display';

import type { AppState } from 'src/reducers/store';
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
    const store = useStore<AppState>();

    return (
        // Todo: Enable when issues are fixed (ReactTruncate & BumpFee)
        // <StrictMode>
        <NetworkDisplayStoreProvider
            store={store}
            selectNetworks={selectEnabledNetworks}
            selectNetworkNamesMap={selectNetworkNamesMap}
        >
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
        </NetworkDisplayStoreProvider>
        // </StrictMode>
    );
};
