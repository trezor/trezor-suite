import { Provider as ReduxProvider } from 'react-redux';

import { type History, createMemoryHistory } from 'history';
import { createRoot } from 'react-dom/client';

import { ServicesProvider } from '@suite-common/redux-utils';
import TrezorConnect from '@trezor/connect';
import { createIpcProxy } from '@trezor/ipc-proxy';
import { desktopApi } from '@trezor/suite-desktop-api';

import { initBluetoothThunk } from 'src/actions/bluetooth/initBluetoothThunk';
import * as STORAGE from 'src/actions/suite/constants/storageConstants';
import { desktopHandshake } from 'src/actions/suite/suiteActions';
import {
    AppRouter,
    Preloader,
    ToastContainer,
    TrafficLightDraggableWindowHeader,
} from 'src/components/suite';
import { Metadata } from 'src/components/suite/Metadata';
import { useDebugLanguageShortcut } from 'src/hooks/suite';
import { initStore } from 'src/reducers/store';
import { createRouterServices } from 'src/support/extraDependencies';
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
import { BioAuthGuard } from '../../suite/src/components/suite/BioAuthGuard/BioAuthGuard';
import { FindBar } from '../../suite/src/components/suite/FindBar/FindBar';

const MainDesktop = ({ history }: { history: History }) => {
    useTor();
    useDebugLanguageShortcut();
    useConnectPopupDesktop();

    return (
        <Main history={history} trafficLightOffset={<TrafficLightDraggableWindowHeader />}>
            <GlobalStyle />
            <DesktopUpdater />
            <Metadata />
            <ToastContainer />
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

    const memoryHistory = createMemoryHistory();
    const preloadAction = await preloadStore();
    const { statePatch } = await desktopApi.handshake();
    const { store, extra } = initStore(preloadAction, {
        statePatch,
        additionalExtraDeps: { routerServices: createRouterServices(memoryHistory) },
    });

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
                <ServicesProvider services={extra.services}>
                    <ReduxProvider store={store}>
                        <ConnectedIntlProvider>
                            <TorLoadingScreen callback={resolve} />
                        </ConnectedIntlProvider>
                    </ReduxProvider>
                </ServicesProvider>,
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
        <ServicesProvider services={extra.services}>
            <ReduxProvider store={store}>
                <MainDesktop history={memoryHistory} />
            </ReduxProvider>
        </ServicesProvider>,
    );
};
