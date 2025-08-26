import { HelmetProvider } from 'react-helmet-async';
import { Router } from 'react-router';

import type { History } from 'history';

import { FormatterProvider } from '@suite-common/formatters';

import { TrafficLightDraggableWindowHeader } from 'src/components/suite';
import { useFormattersConfig } from 'src/hooks/suite';
import Autodetect from 'src/support/suite/Autodetect';
import { ConnectedIntlProvider } from 'src/support/suite/ConnectedIntlProvider';
import { ConnectedThemeProvider } from 'src/support/suite/ConnectedThemeProvider';
import { ErrorBoundary } from 'src/support/suite/ErrorBoundary';
import OnlineStatus from 'src/support/suite/OnlineStatus';
import Protocol from 'src/support/suite/Protocol';
import Resize from 'src/support/suite/Resize';
import { ResponsiveContextProvider } from 'src/support/suite/ResponsiveContext';

import { RouterHandler } from './RouterHandler';
import { useConnectPopupModals } from './useConnectPopupModals';

export const Main = ({ history, children }: { history: History; children: React.ReactNode }) => {
    useConnectPopupModals();
    const formattersConfig = useFormattersConfig();

    return (
        // Todo: Enable when issues are fixed (ReactTruncate & BumpFee)
        // <StrictMode>
        <HelmetProvider>
            <TrafficLightDraggableWindowHeader />
            <ConnectedThemeProvider>
                <Router location={history.location} navigator={history}>
                    <ResponsiveContextProvider>
                        <ErrorBoundary>
                            <Autodetect />
                            <Resize />
                            <Protocol />
                            <OnlineStatus />
                            <RouterHandler history={history} />
                            <ConnectedIntlProvider>
                                <FormatterProvider config={formattersConfig}>
                                    {children}
                                </FormatterProvider>
                            </ConnectedIntlProvider>
                        </ErrorBoundary>
                    </ResponsiveContextProvider>
                </Router>
            </ConnectedThemeProvider>
        </HelmetProvider>
        // </StrictMode>
    );
};
