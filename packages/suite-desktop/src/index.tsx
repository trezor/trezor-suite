import React, { useEffect } from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Router as RouterProvider } from 'react-router-dom';
import { init as initSentry } from '@sentry/electron/renderer';
import { desktopApi } from '@trezor/suite-desktop-api';

import { store } from '@suite/reducers/store';

import Metadata from '@suite-components/Metadata';
import Preloader from '@suite-components/Preloader';
import ToastContainer from '@suite-components/ToastContainer';
import { ConnectedIntlProvider } from '@suite-support/ConnectedIntlProvider';
import Resize from '@suite-support/Resize';
import Autodetect from '@suite-support/Autodetect';
import Protocol from '@suite-support/Protocol';
import Tor from '@suite-support/Tor';
import OnlineStatus from '@suite-support/OnlineStatus';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import RouterHandler from '@suite-support/Router';
import ThemeProvider from '@suite-support/ThemeProvider';
import history from '@suite/support/history';
import AppRouter from './support/Router';
import DesktopUpdater from './support/DesktopUpdater';
import { SENTRY_CONFIG } from '@suite/config/suite';
import { ModalContextProvider } from '@suite-support/ModalContext';

const Index = () => {
    useEffect(() => {
        initSentry(SENTRY_CONFIG);

        desktopApi.clientReady();
    }, []);

    return (
        <ReduxProvider store={store}>
            <ThemeProvider>
                <RouterProvider history={history}>
                    <ModalContextProvider>
                        <ErrorBoundary>
                            <Autodetect />
                            <Resize />
                            <Tor />
                            <Protocol />
                            <OnlineStatus />
                            <RouterHandler />
                            <ConnectedIntlProvider>
                                <DesktopUpdater>
                                    <Metadata />
                                    <ToastContainer />
                                    <Preloader>
                                        <AppRouter />
                                    </Preloader>
                                </DesktopUpdater>
                            </ConnectedIntlProvider>
                        </ErrorBoundary>
                    </ModalContextProvider>
                </RouterProvider>
            </ThemeProvider>
        </ReduxProvider>
    );
};

render(<Index />, document.getElementById('app'));
