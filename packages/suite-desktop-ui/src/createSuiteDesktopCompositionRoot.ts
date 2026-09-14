import { createMemoryHistory } from 'history';

import { createElectronPlatformEncryption } from '@suite/platform-encryption-electron';
import { toGetter } from '@suite-common/dependency-injection';
import { type NetworksServices, createNetworksCompositionRoot } from '@suite-common/networks';
import TrezorConnect from '@trezor/connect-electron';
import { desktopApi } from '@trezor/suite-desktop-api';

import { createHydrateReduxStore } from 'src/reducers/createHydrateReduxStore';
import { type SuiteReduxStore, createReduxStore } from 'src/reducers/createReduxStore';
import { rootReducer } from 'src/reducers/store';
import { createSuiteServicesCompositionRoot } from 'src/support/createSuiteCompositionRoot';
import { extraDependencies } from 'src/support/extraDependencies';

import { type DesktopApp, createDesktopApp } from './createDesktopApp';

type SuiteDesktopCompositionRoot = { app: DesktopApp };

export const createSuiteDesktopCompositionRoot = (): SuiteDesktopCompositionRoot => {
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

    // eslint-disable-next-line prefer-const -- Forward declaration for the network dispatch closure.
    let store: SuiteReduxStore;

    const networks: NetworksServices = createNetworksCompositionRoot({
        getTrezorConnect: () => TrezorConnect,
        dispatch: action => store.dispatch(action),
    });
    const networkConfigDeps = networks;

    const reduxStore = createReduxStore({
        ...networkConfigDeps,
        reducer: rootReducer,
        extraDependencies,
    });
    store = reduxStore.store;
    const suiteServices = createSuiteServicesCompositionRoot({
        networks,
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
    const hydrateReduxStore = createHydrateReduxStore({ store, reducer: rootReducer });
    const services = { ...suiteServices, store, hydrateReduxStore };
    // Services need the store's dispatch/getState, while Redux thunks need those services in extra.
    // Inject them after construction to break the cycle, before the app can dispatch any actions.
    reduxStore.injectServicesIntoReduxExtra(services);

    return { app: createDesktopApp({ desktopApi, services }) };
};
