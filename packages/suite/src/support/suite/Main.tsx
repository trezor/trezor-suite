import { HelmetProvider } from 'react-helmet-async';

import { injectQueryClient } from '@suite-common/react-query';
import { ReactQueryProvider } from '@suite-common/react-query/react';
import { SelectCacheProvider } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';

import { SendSessionProvider } from 'src/support/chainSend/SendSessionProvider';
import Autodetect from 'src/support/suite/Autodetect';
import { ConnectedThemeProvider } from 'src/support/suite/ConnectedThemeProvider';
import { ErrorBoundary } from 'src/support/suite/ErrorBoundary';
import OnlineStatus from 'src/support/suite/OnlineStatus';
import Protocol from 'src/support/suite/Protocol';
import Resize from 'src/support/suite/Resize';
import { ResponsiveContextProvider } from 'src/support/suite/ResponsiveContext';

import { ConnectPopupModals } from './ConnectPopupModals';
import { ConnectedFormatterProvider } from './ConnectedFormatterProvider';
import { ConnectedIntlProvider } from './ConnectedIntlProvider';
import { RouterHandler } from './RouterHandler';

type MainProps = {
    trafficLightOffset?: React.ReactNode;
    children: React.ReactNode;
};

export const Main = ({ trafficLightOffset, children }: MainProps) => {
    const { queryClient } = useServices(injectQueryClient);

    return (
        // Todo: Enable when issues are fixed (ReactTruncate & BumpFee)
        // <StrictMode>
        <HelmetProvider>
            {trafficLightOffset ?? null}
            <ConnectPopupModals />
            <ConnectedThemeProvider>
                <ResponsiveContextProvider>
                    <ErrorBoundary>
                        <ReactQueryProvider client={queryClient}>
                            <Autodetect />
                            <Resize />
                            <Protocol />
                            <OnlineStatus />
                            <RouterHandler />
                            <ConnectedIntlProvider>
                                <SelectCacheProvider>
                                    <ConnectedFormatterProvider>
                                        <SendSessionProvider>{children}</SendSessionProvider>
                                    </ConnectedFormatterProvider>
                                </SelectCacheProvider>
                            </ConnectedIntlProvider>
                        </ReactQueryProvider>
                    </ErrorBoundary>
                </ResponsiveContextProvider>
            </ConnectedThemeProvider>
        </HelmetProvider>
        // </StrictMode>
    );
};
