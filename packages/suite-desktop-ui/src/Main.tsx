import { Provider as ReduxProvider } from 'react-redux';
import { Router as RouterProvider } from 'react-router-dom';

import { createRoot } from 'react-dom/client';
import { init as initSentry } from '@sentry/electron/renderer';

import { SENTRY_CONFIG } from '@suite-common/sentry';
import { desktopApi } from '@trezor/suite-desktop-api';
import { FormatterProvider } from '@suite-common/formatters';
import { createIpcProxy } from '@trezor/ipc-proxy';
import TrezorConnect from '@trezor/connect';

import { initStore } from 'src/reducers/store';
import { preloadStore } from 'src/support/suite/preloadStore';
import { Metadata } from 'src/components/suite/Metadata';
import { Preloader, ToastContainer } from 'src/components/suite';
import { ConnectedIntlProvider } from 'src/support/suite/ConnectedIntlProvider';
import Resize from 'src/support/suite/Resize';
import Autodetect from 'src/support/suite/Autodetect';
import Protocol from 'src/support/suite/Protocol';
import { useTor } from 'src/support/suite/useTor';
import OnlineStatus from 'src/support/suite/OnlineStatus';
import ErrorBoundary from 'src/support/suite/ErrorBoundary';
import RouterHandler from 'src/support/suite/Router';
import { ConnectedThemeProvider } from 'src/support/suite/ConnectedThemeProvider';
import { LoadingScreen } from 'src/support/suite/screens/LoadingScreen';
import { ErrorScreen } from 'src/support/suite/screens/ErrorScreen';
import { useFormattersConfig } from 'src/hooks/suite';
import history from 'src/support/history';
import { ModalContextProvider } from 'src/support/suite/ModalContext';
import { desktopHandshake } from 'src/actions/suite/suiteActions';
import * as STORAGE from 'src/actions/suite/constants/storageConstants';

import { DesktopUpdater } from './support/DesktopUpdater';
import { AppRouter } from './support/Router';
import { TorLoadingScreen } from './support/screens/TorLoadingScreen';
import { Bluetooth } from './support/Bluetooth';

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
                        <ConnectedIntlProvider>
                            <FormatterProvider config={formattersConfig}>
                                <DesktopUpdater>
                                    <Bluetooth />
                                    <Metadata />
                                    <ToastContainer />
                                    <Preloader>
                                        <AppRouter />
                                    </Preloader>
                                </DesktopUpdater>
                            </FormatterProvider>
                        </ConnectedIntlProvider>
                    </ErrorBoundary>
                </ModalContextProvider>
            </RouterProvider>
        </ConnectedThemeProvider>
    );
};

export const init = async (container: HTMLElement) => {
    initSentry(SENTRY_CONFIG);

    // render simple loader with theme provider without redux, wait for indexedDB
    const root = createRoot(container);
    root.render(<LoadingScreen />);

    const preloadAction = await preloadStore();
    const store = initStore(preloadAction);

    await desktopApi.handshake();

    // start logging to file if Debug menu is active
    if (
        preloadAction?.type === STORAGE.LOAD &&
        preloadAction.payload.suiteSettings?.settings.debug.showDebugMenu
    ) {
        desktopApi.configLogger({
            level: 'debug',
            options: {
                writeToDisk: true,
            },
        });
    }

    // Loading Tor as separate module, before the rest of the modules.
    const { shouldRunTor } = await desktopApi.loadTorModule();

    // When we run this first time `shouldRunTor` will tell if Tor should run according to previous settings,
    // when it runs because of renderer (e.g. Ctrl+R) it will always be false.
    if (shouldRunTor) {
        await new Promise(resolve => {
            root.render(
                <ReduxProvider store={store}>
                    <ConnectedIntlProvider>
                        <TorLoadingScreen callback={resolve} />
                    </ConnectedIntlProvider>
                </ReduxProvider>,
            );
            desktopApi.toggleTor(true);
        });
    }

    const loadModules = await desktopApi.loadModules(null);
    if (!loadModules.success) {
        // loading failed, render error with theme provider without redux and do not continue
        root.render(<ErrorScreen error={loadModules.error} />);
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
    root.render(
        <ReduxProvider store={store}>
            <Main />
        </ReduxProvider>,
    );
};
