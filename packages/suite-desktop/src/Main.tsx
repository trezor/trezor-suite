import React from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Router as RouterProvider } from 'react-router-dom';
import { init as initSentry } from '@sentry/electron/renderer';
import { desktopApi } from '@trezor/suite-desktop-api';

import { initStore } from '@suite/reducers/store';
import { preloadStore } from '@suite-support/preloadStore';
import { isDev } from '@suite-utils/build';

import Metadata from '@suite-components/Metadata';
import Preloader from '@suite-components/Preloader';
import ToastContainer from '@suite-components/ToastContainer';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import Resize from '@suite-support/Resize';
import Autodetect from '@suite-support/Autodetect';
import Protocol from '@suite-support/Protocol';
import { useTor } from '@suite-support/useTor';
import OnlineStatus from '@suite-support/OnlineStatus';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import RouterHandler from '@suite-support/Router';
import { ConnectedThemeProvider } from '@suite-support/ConnectedThemeProvider';
import { LoadingScreen } from '@suite-support/screens/LoadingScreen';
import { ErrorScreen } from '@suite-support/screens/ErrorScreen';
import { ModulesLoadingScreen } from './support/screens/ModulesLoadingScreen';
import history from '@suite/support/history';
import AppRouter from './support/Router';
import DesktopUpdater from './support/DesktopUpdater';
import { SENTRY_CONFIG } from '@suite/config/suite';
import { ModalContextProvider } from '@suite-support/ModalContext';
import { desktopHandshake } from '@suite-actions/suiteActions';

const Main = () => {
    useTor();

    return (
        <ConnectedThemeProvider>
            <RouterProvider history={history}>
                <ModalContextProvider>
                    <ErrorBoundary>
                        <Autodetect />
                        <Resize />
                        <Protocol />
                        <OnlineStatus />
                        <RouterHandler />
                        <IntlProvider>
                            <DesktopUpdater>
                                <Metadata />
                                <ToastContainer />
                                <Preloader>
                                    <AppRouter />
                                </Preloader>
                            </DesktopUpdater>
                        </IntlProvider>
                    </ErrorBoundary>
                </ModalContextProvider>
            </RouterProvider>
        </ConnectedThemeProvider>
    );
};

export const init = async (root: HTMLElement) => {
    if (!isDev) {
        initSentry(SENTRY_CONFIG);
    }

    // render simple loader with theme provider without redux, wait for indexedDB
    render(<LoadingScreen />, root);

    const preloaded = await preloadStore();
    const store = initStore(preloaded);

    await desktopApi.handshake();

    // render more complex interactive loader with theme provider without redux
    render(<ModulesLoadingScreen />, root);

    // start loading desktop modules, handle progress in <ModulesLoadingScreen />
    const loadModules = await desktopApi.loadModules(null);
    if (!loadModules.success) {
        // loading failed, render error with theme provider without redux and do not continue
        render(<ErrorScreen error={loadModules.error} />, root);
        return;
    }

    store.dispatch(desktopHandshake(loadModules.payload));

    // finally render whole app
    render(
        <ReduxProvider store={store}>
            <Main />
        </ReduxProvider>,
        root,
    );
};
