import React, { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Router as RouterProvider } from 'react-router-dom';
import TrezorConnect from 'trezor-connect';

import { store } from '@suite/reducers/store';
import { isDev } from '@suite-utils/build';
import { SENTRY_CONFIG } from '@suite-config';

import * as Sentry from '@sentry/browser';
import Metadata from '@suite-components/Metadata';
import Preloader from '@suite-components/Preloader';
import ToastContainer from '@suite-components/ToastContainer';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import Resize from '@suite-support/Resize';
import Tor from '@suite-support/Tor';
import OnlineStatus from '@suite-support/OnlineStatus';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import RouterHandler from '@suite-support/Router';
import ThemeProvider from '@suite-support/ThemeProvider';
import history from '@suite/support/history';
import { isEnabled } from '@suite-utils/features';

import AppRouter from './support/Router';
import { CypressExportStore } from './support/CypressExportStore';
import GlobalStyles from '@suite-support/styles/global';

if ('serviceWorker' in navigator && isEnabled('PWA')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(`${process.env.ASSET_PREFIX}/sw.js`);
    });
}

const Main = () => {
    useEffect(() => {
        if (!window.Cypress && !isDev()) {
            Sentry.init(SENTRY_CONFIG);
            Sentry.configureScope(scope => {
                scope.setTag('version', process.env.VERSION || 'undefined');
            });
        }
        if (window.Cypress) {
            // exposing ref to TrezorConnect allows us to mock its methods in cypress tests
            window.TrezorConnect = TrezorConnect;
        }
    }, []);

    return (
        <>
            <CypressExportStore store={store} />
            <ReduxProvider store={store}>
                <ThemeProvider>
                    <RouterProvider history={history}>
                        <GlobalStyles />
                        <ErrorBoundary>
                            <Resize />
                            <Tor />
                            <OnlineStatus />
                            <RouterHandler />
                            <IntlProvider>
                                <Metadata />
                                <ToastContainer />
                                <Preloader>
                                    <AppRouter />
                                </Preloader>
                            </IntlProvider>
                        </ErrorBoundary>
                    </RouterProvider>
                </ThemeProvider>
            </ReduxProvider>
        </>
    );
};

export default <Main />;
