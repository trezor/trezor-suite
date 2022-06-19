import React from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Router as RouterProvider } from 'react-router-dom';
import { init as initSentry } from '@sentry/browser';

import { isDev } from '@suite-utils/build';
import { store } from '@suite/reducers/store';
import { SENTRY_CONFIG } from '@suite-config';

import Metadata from '@suite-components/Metadata';
import Preloader from '@suite-components/Preloader';
import ToastContainer from '@suite-components/ToastContainer';
import { ConnectedIntlProvider } from '@suite-support/ConnectedIntlProvider';
import Resize from '@suite-support/Resize';
import Protocol from '@suite-support/Protocol';
import Autodetect from '@suite-support/Autodetect';
import Tor from '@suite-support/Tor';
import OnlineStatus from '@suite-support/OnlineStatus';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import RouterHandler from '@suite-support/Router';
import ThemeProvider from '@suite-support/ThemeProvider';
import history from '@suite/support/history';
import { ModalContextProvider } from '@suite-support/ModalContext';

import AppRouter from './support/Router';
import { useCypress } from './support/useCypress';

const Main = () => {
    useCypress();

    return (
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
                            <Metadata />
                            <ToastContainer />
                            <Preloader>
                                <AppRouter />
                            </Preloader>
                        </ConnectedIntlProvider>
                    </ErrorBoundary>
                </ModalContextProvider>
            </RouterProvider>
        </ThemeProvider>
    );
};

export const init = (root: HTMLElement) => {
    if (!window.Cypress && !isDev) {
        initSentry(SENTRY_CONFIG);
    }

    render(
        <ReduxProvider store={store}>
            <Main />
        </ReduxProvider>,
        root,
    );
};
