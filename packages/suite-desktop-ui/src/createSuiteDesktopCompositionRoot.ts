import { createMemoryHistory } from 'history';

import { createElectronPlatformEncryption } from '@suite/platform-encryption-electron';
import { toGetter } from '@suite-common/dependency-injection';
import { desktopApi } from '@trezor/suite-desktop-api';

import { createNetworksCompositionRoot, registerNetworkServices } from '@suite-common/networks';
import TrezorConnect from '@trezor/connect';

import { createHydrateReduxStore } from 'src/reducers/createHydrateReduxStore';
import { createReduxStore } from 'src/reducers/createReduxStore';
import { rootReducer } from 'src/reducers/store';
import { createSuiteServicesCompositionRoot } from 'src/support/createSuiteCompositionRoot';
import { extraDependencies } from 'src/support/extraDependencies';

import { type DesktopInit, createDesktopInit } from './createDesktopInit';

type SuiteDesktopCompositionRoot = { init: DesktopInit };

export const createSuiteDesktopCompositionRoot = (): SuiteDesktopCompositionRoot => {
    const networks = createNetworksCompositionRoot({ getTrezorConnect: () => TrezorConnect });
    registerNetworkServices(networks);

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
    });
    const hydrateReduxStore = createHydrateReduxStore({ store, reducer: rootReducer });
    const services = { ...suiteServices, store, hydrateReduxStore };
    // Services need the store's dispatch/getState, while Redux thunks need those services in extra.
    // Inject them after construction to break the cycle, before init can dispatch any actions.
    injectServicesIntoReduxExtra(services);

    return { init: createDesktopInit({ services }) };
};
