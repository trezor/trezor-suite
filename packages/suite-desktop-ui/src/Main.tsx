import React from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { Router as RouterProvider } from 'react-router-dom';

import { init as initSentry } from '@sentry/electron/renderer';
import { initStore } from '@suite/reducers/store';
import { preloadStore } from '@suite-support/preloadStore';
import Metadata from '@suite-components/Metadata';
import Preloader from '@suite-components/Preloader';
import { ToastContainer } from '@suite-components/ToastContainer';
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
import { useFormattersConfig } from '@suite-hooks';
import history from '@suite/support/history';
import { ModalContextProvider } from '@suite-support/ModalContext';
import { desktopHandshake } from '@suite-actions/suiteActions';

import { SENTRY_CONFIG } from '@suite-common/sentry';
import { desktopApi } from '@trezor/suite-desktop-api';
import { FormatterProvider } from '@suite-common/formatters';
import { createIpcProxy } from '@trezor/ipc-proxy';
import TrezorConnect from '@trezor/connect';

import { DesktopUpdater } from './support/DesktopUpdater';
import { AppRouter } from './support/Router';
import { TorLoadingScreen } from './support/screens/TorLoadingScreen';

const Main = () => {
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
                                <DesktopUpdater>
                                    <Metadata />
                                    <ToastContainer />
                                    <Preloader>
                                        <AppRouter />
                                    </Preloader>
                                </DesktopUpdater>
                            </FormatterProvider>
                        </IntlProvider>
                    </ErrorBoundary>
                </ModalContextProvider>
            </RouterProvider>
        </ConnectedThemeProvider>
    );
};

export const init = async (root: HTMLElement) => {
    initSentry(SENTRY_CONFIG);

    // render simple loader with theme provider without redux, wait for indexedDB
    render(<LoadingScreen />, root);

    const preloadAction = await preloadStore();
    const store = initStore(preloadAction);

    await desktopApi.handshake();

    // Loading Tor as separate module, before the rest of the modules.
    const { shouldRunTor } = await desktopApi.loadTorModule();

    // When we run this first time `shouldRunTor` will tell if Tor should run according to previous settings,
    // when it runs because of renderer (e.g. Ctrl+R) it will always be false.
    if (shouldRunTor) {
        await new Promise(resolve => {
            render(
                <ReduxProvider store={store}>
                    <IntlProvider>
                        <TorLoadingScreen callback={resolve} />
                    </IntlProvider>
                </ReduxProvider>,
                root,
            );
            desktopApi.toggleTor(true);
        });
    }

    const loadModules = await desktopApi.loadModules(null);
    if (!loadModules.success) {
        // loading failed, render error with theme provider without redux and do not continue
        render(<ErrorScreen error={loadModules.error} />, root);
        return;
    }

    store.dispatch(desktopHandshake(loadModules.payload));

    // create ipc-proxy for @trezor/connect
    const proxy = await createIpcProxy<typeof TrezorConnect>('TrezorConnect');
    // override each method of @trezor/connect using ipc-proxy
    Object.keys(TrezorConnect).forEach(method => {
        // @ts-expect-error key vs union of values endless problem
        TrezorConnect[method] = proxy[method];
    });

    // finally render whole app
    render(
        <ReduxProvider store={store}>
            <Main />
        </ReduxProvider>,
        root,
    );
};
