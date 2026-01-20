import { Provider as ReduxProvider } from 'react-redux';

import { createMemoryHistory } from 'history';
import { createRoot } from 'react-dom/client';

import TrezorConnect from '@trezor/connect';
import { createIpcProxy } from '@trezor/ipc-proxy';
import { desktopApi } from '@trezor/suite-desktop-api';

import { initBluetoothThunk } from 'src/actions/bluetooth/initBluetoothThunk';
import * as STORAGE from 'src/actions/suite/constants/storageConstants';
import { desktopHandshake } from 'src/actions/suite/suiteActions';
import {
    AppRouter,
    Preloader,
    ToasterProvider,
    TrafficLightDraggableWindowHeader,
} from 'src/components/suite';
import { BioAuthGuard } from 'src/components/suite/BioAuthGuard/BioAuthGuard';
import { FindBar } from 'src/components/suite/FindBar/FindBar';
import { Metadata } from 'src/components/suite/Metadata';
import { useDebugLanguageShortcut } from 'src/hooks/suite';
import { initStore } from 'src/reducers/store';
import { SuiteServicesProvider } from 'src/support/SuiteServicesProvider';
import { ConnectedIntlProvider } from 'src/support/suite/ConnectedIntlProvider';
import { Main } from 'src/support/suite/Main';
import { preloadStore } from 'src/support/suite/preloadStore';
import { ErrorScreen } from 'src/support/suite/screens/ErrorScreen';
import { LoadingScreen } from 'src/support/suite/screens/LoadingScreen';
import { useConnectPopupDesktop } from 'src/support/suite/useConnectPopupDesktop';
import { useTor } from 'src/support/suite/useTor';

import { GlobalStyle } from './GlobalStyle';
import { initSentry } from './sentry';
import { DesktopUpdater } from './support/DesktopUpdater';
import { desktopComponents } from './support/desktopComponents';
import { TorLoadingScreen } from './support/screens/TorLoadingScreen';

const MainDesktop = () => {
    useTor();
    useDebugLanguageShortcut();
    useConnectPopupDesktop();

    return (
        <Main trafficLightOffset={<TrafficLightDraggableWindowHeader />}>
            <GlobalStyle />
            <DesktopUpdater />
            <Metadata />
            <ToasterProvider />
            <BioAuthGuard>
                <Preloader>
                    <AppRouter components={desktopComponents} />
                    <ConnectedIntlProvider>
                        <FindBar />
                    </ConnectedIntlProvider>
                </Preloader>
            </BioAuthGuard>
        </Main>
    );
};

export const init = async (container: HTMLElement) => {
    initSentry();

    // render simple loader with theme provider without redux, wait for indexedDB
    const root = createRoot(container);
    root.render(<LoadingScreen />);

    const preloadAction = await preloadStore();
    const { statePatch } = await desktopApi.handshake();
    const { store, services } = initStore(
        {
            history: createMemoryHistory(),
        },
        preloadAction,
        {
            statePatch,
        },
    );

    // Expose Redux store for Playwright/e2e tests
    if (typeof window !== 'undefined' && window.desktopFlags?.exposeStore) {
        (window as any).store = store;
    }

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
                <SuiteServicesProvider services={services}>
                    <ReduxProvider store={store}>
                        <ConnectedIntlProvider>
                            <TorLoadingScreen callback={resolve} />
                        </ConnectedIntlProvider>
                    </ReduxProvider>
                </SuiteServicesProvider>,
            );
            desktopApi.toggleTor(true);
        });
    }

    const loadModules = await desktopApi.loadModules({
        legacyBioAuthEnabled: store.getState()?.bioAuth?.bioAuthEnabled,
    });
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

    // init bluetooth module
    // TODO should it really be here instead of initAction.ts?
    await store.dispatch(initBluetoothThunk());

    // finally render whole app
    root.render(
        <SuiteServicesProvider services={services}>
            <ReduxProvider store={store}>
                <MainDesktop />
            </ReduxProvider>
        </SuiteServicesProvider>,
    );
};
