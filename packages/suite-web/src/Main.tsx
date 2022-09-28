import React from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Router as RouterProvider } from 'react-router-dom';
import { init as initSentry } from '@sentry/browser';

import { initStore } from '@suite/reducers/store';
import { preloadStore } from '@suite-support/preloadStore';
import { SENTRY_CONFIG } from '@suite-common/sentry';

import Metadata from '@suite-components/Metadata';
import Preloader from '@suite-components/Preloader';
import { ToastContainer } from '@suite-components';
import IntlProvider from '@suite-support/ConnectedIntlProvider';
import Resize from '@suite-support/Resize';
import Protocol from '@suite-support/Protocol';
import Autodetect from '@suite-support/Autodetect';
import { useTor } from '@suite-support/useTor';
import OnlineStatus from '@suite-support/OnlineStatus';
import ErrorBoundary from '@suite-support/ErrorBoundary';
import RouterHandler from '@suite-support/Router';
import { ConnectedThemeProvider } from '@suite-support/ConnectedThemeProvider';
import { LoadingScreen } from '@suite-support/screens/LoadingScreen';
import { useFormattersConfig } from '@suite-hooks';
import history from '@suite/support/history';
import { ModalContextProvider } from '@suite-support/ModalContext';

import AppRouter from './support/Router';
import { useCypress } from './support/useCypress';
import { FormatterProvider } from '@suite-common/formatters';

const Main = () => {
    useCypress();
    useTor();
    const formattersConfig = useFormattersConfig();

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
                            <FormatterProvider config={formattersConfig}>
                                <Metadata />
                                <ToastContainer />
                                <Preloader>
                                    <AppRouter />
                                </Preloader>
                            </FormatterProvider>
                        </IntlProvider>
                    </ErrorBoundary>
                </ModalContextProvider>
            </RouterProvider>
        </ConnectedThemeProvider>
    );
};

export const init = async (root: HTMLElement) => {
    if (!window.Cypress) {
        initSentry(SENTRY_CONFIG);
    }

    // render simple loader with theme provider without redux, wait for indexedDB
    render(<LoadingScreen />, root);

    const preloadAction = await preloadStore();
    const store = initStore(preloadAction);

    render(
        <ReduxProvider store={store}>
            <Main />
        </ReduxProvider>,
        root,
    );
};
