/* eslint-disable import/order */
import { Provider as ReduxProvider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { createRoot } from 'react-dom/client';
import { init as initSentry } from '@sentry/browser';

import { SENTRY_CONFIG } from '@suite-common/sentry';
import { FormatterProvider } from '@suite-common/formatters';

import { initStore } from 'src/reducers/store';
import { preloadStore } from 'src/support/suite/preloadStore';
import { AppRouter, BundleLoader, Metadata, Preloader, ToastContainer } from 'src/components/suite';
import { ConnectedIntlProvider } from 'src/support/suite/ConnectedIntlProvider';
import Resize from 'src/support/suite/Resize';
import Protocol from 'src/support/suite/Protocol';
import Autodetect from 'src/support/suite/Autodetect';
import { useTor } from 'src/support/suite/useTor';
import { useConnectPopupModals } from 'src/support/suite/useConnectPopupModals';
import OnlineStatus from 'src/support/suite/OnlineStatus';
import { ErrorBoundary } from 'src/support/suite/ErrorBoundary';
import { RouterHandler } from 'src/support/suite/RouterHandler';
import { ConnectedThemeProvider } from 'src/support/suite/ConnectedThemeProvider';
import { LoadingScreen } from 'src/support/suite/screens/LoadingScreen';
import { useDebugLanguageShortcut, useFormattersConfig } from 'src/hooks/suite';

import { usePlaywright } from './support/usePlaywright';
import { ResponsiveContextProvider } from 'src/support/suite/ResponsiveContext';
import { Suspense } from 'react';
import { webComponents } from './support/webComponents';
import { Router } from 'react-router';
import type { History } from 'history';
import { createBrowserHistory } from 'history';
import { createRouterServices } from 'src/support/extraDependencies';

const MainWeb = ({ history }: { history: History }) => {
    usePlaywright();
    useTor();
    useDebugLanguageShortcut();
    useConnectPopupModals();
    const formattersConfig = useFormattersConfig();

    return (
        // Todo: Enable when issues are fixed (ReactTruncate & BumpFee)
        // <StrictMode>
        <HelmetProvider>
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
                                    <Metadata />
                                    <ToastContainer />
                                    <Preloader>
                                        <Suspense fallback={<BundleLoader />}>
                                            <AppRouter components={webComponents} />
                                        </Suspense>
                                    </Preloader>
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

export const init = async (container: HTMLElement) => {
    if (!window.Playwright) {
        initSentry(SENTRY_CONFIG);
    }

    const browserHistory = createBrowserHistory();

    // render simple loader with theme provider without redux, wait for indexedDB
    const root = createRoot(container);
    root.render(<LoadingScreen />);

    const preloadAction = await preloadStore();
    const store = initStore(preloadAction, {
        additionalExtraDeps: {
            routerServices: createRouterServices(browserHistory),
        },
    });

    root.render(
        <ReduxProvider store={store}>
            <MainWeb history={browserHistory} />
        </ReduxProvider>,
    );
};
