import React, { useEffect, useState } from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Router as RouterProvider } from 'react-router-dom';

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

import AppRouter from './support/Router';
import DesktopTitlebarWrapper from './support/DesktopTitlebar';
import DesktopUpdater from './support/DesktopUpdater';
import GlobalStyles from '@suite-support/styles/global';

const Index = () => {
    const [isUpdateVisible, setIsUpdateVisible] = useState(false);

    useEffect(() => {
        if (!isDev()) {
            Sentry.init(SENTRY_CONFIG);
            Sentry.configureScope(scope => {
                scope.setTag('version', process.env.VERSION || 'undefined');
            });
        }
        window.desktopApi!.clientReady();
    }, []);

    return (
        <ReduxProvider store={store}>
            <ThemeProvider>
                <RouterProvider history={history}>
                    <GlobalStyles />
                    <DesktopTitlebarWrapper>
                        <ErrorBoundary>
                            <Resize />
                            <Tor />
                            <OnlineStatus />
                            <RouterHandler />
                            <IntlProvider>
                                <DesktopUpdater setIsUpdateVisible={setIsUpdateVisible} />
                                <Metadata />
                                <ToastContainer />
                                <Preloader hideModals={isUpdateVisible}>
                                    <AppRouter />
                                </Preloader>
                            </IntlProvider>
                        </ErrorBoundary>
                    </DesktopTitlebarWrapper>
                </RouterProvider>
            </ThemeProvider>
        </ReduxProvider>
    );
};

render(<Index />, document.getElementById('app'));
