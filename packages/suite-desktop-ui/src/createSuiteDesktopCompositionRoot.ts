import { createMemoryHistory } from 'history';

import { createElectronPlatformEncryption } from '@suite/platform-encryption-electron';
import { toGetter } from '@suite-common/dependency-injection';
import TrezorConnect from '@trezor/connect-electron';
import { createElectronDesktopApi } from '@trezor/suite-desktop-api-electron';

import { createHydrateReduxStore } from 'src/reducers/createHydrateReduxStore';
import { createReduxStore } from 'src/reducers/createReduxStore';
import { rootReducer } from 'src/reducers/store';
import { createDb } from 'src/storage/createDb';
import { createSuiteServicesCompositionRoot } from 'src/support/createSuiteCompositionRoot';
import { extraDependencies } from 'src/support/extraDependencies';
import { createPreloadStore } from 'src/support/suite/createPreloadStore';

import { type DesktopApp, createDesktopApp } from './createDesktopApp';

type SuiteDesktopCompositionRoot = { app: DesktopApp };

export const createSuiteDesktopCompositionRoot = (): SuiteDesktopCompositionRoot => {
    const desktopApi = createElectronDesktopApi();
    const history = createMemoryHistory();
    const platformEncryption = createElectronPlatformEncryption({ desktopApi });
    const reloadApp = desktopApi.appRestart;

    // The desktop renderer can't construct node-only transports (`usb`/`dgram`), so each factory
    // yields the identifier string; the main process (`@trezor/suite-desktop-core`'s
    // trezor-connect.ts) maps it to a real Transport instance below the IPC boundary. This also
    // keeps `@trezor/transport` out of the renderer bundle.
    const getTransportsFactories = () => ({
        BridgeTransport: () => 'BridgeTransport' as const,
        NodeUsbTransport: () => 'NodeUsbTransport' as const,
        UdpTransport: () => 'UdpTransport' as const,
    });

    const { store, injectServicesIntoReduxExtra } = createReduxStore({
        reducer: rootReducer,
        extraDependencies,
    });
    const db = createDb({ dispatch: store.dispatch, reloadApp });
    const suiteServices = createSuiteServicesCompositionRoot({
        db,
        desktopApi,
        dispatch: store.dispatch,
        getState: store.getState,
        history,
        platformEncryption,
        createLogger: undefined,
        getBinFilesBaseUrl: toGetter(store.getState, state => state.desktop?.paths?.binDir),
        reloadApp,
        thpHostName: undefined,
        getTransportsFactories,
        getTrezorConnect: () => TrezorConnect,
    });
    const preloadStore = createPreloadStore({ db });
    const hydrateReduxStore = createHydrateReduxStore({
        store,
        reducer: rootReducer,
        preloadStore,
        getStatePatch: async () => (await desktopApi.handshake()).statePatch,
    });
    const services = { ...suiteServices, store, hydrateReduxStore };
    // Services need the store's dispatch/getState, while Redux thunks need those services in extra.
    // Inject them after construction to break the cycle, before the app can dispatch any actions.
    injectServicesIntoReduxExtra(services);

    return { app: createDesktopApp({ desktopApi, services }) };
};
