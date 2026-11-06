import { createBrowserHistory } from 'history';

import { createWebauthnPlatformEncryption } from '@suite/platform-encryption-webauthn';
import {
    createConnectLoggerFactory,
    createHydrateReduxStore,
    createReduxStore,
    createSuiteServicesCompositionRoot,
    extraDependencies,
    rootReducer,
} from '@suite-app/app';
import { createSuiteSyncDesktopCompositionRoot } from '@suite-app/suite-sync';
import TrezorConnect from '@trezor/connect';
import { asGetter } from '@trezor/dependency-injection';
import { resolveConnectPath } from '@trezor/env-utils';
import type { CreateLogger } from '@trezor/logger';
import { createDb, createPreloadStore } from '@trezor/suite';
import { BridgeTransport } from '@trezor/transport-common';
import { WebUsbTransport } from '@trezor/transport-web';

import { type WebApp, createWebApp } from './createWebApp';
import { createWebDesktopApi } from './support/createWebDesktopApi';
import { getWebThpHostName } from './support/getWebThpHostName';

type SuiteWebCompositionRoot = { app: WebApp };

export const createSuiteWebCompositionRoot = (): SuiteWebCompositionRoot => {
    const history = createBrowserHistory();
    const platformEncryption = createWebauthnPlatformEncryption();
    const reloadApp = () => window.location.reload();

    const getTransportsFactories = () => {
        // Pure DI: connect expects ready-made Transport instances, so the host constructs
        // them here. `id` becomes the Bridge session owner shown to the user; it mirrors
        // the web manifest's `appName` (see suite-app/app/src/createSuiteCompositionRoot.ts).
        const TRANSPORT_ID = 'Trezor Suite web';

        return {
            BridgeTransport: (createLogger?: CreateLogger) =>
                new BridgeTransport({
                    id: TRANSPORT_ID,
                    logger: createLogger?.('@trezor/transport'),
                }),
            WebUsbTransport: (createLogger?: CreateLogger) =>
                new WebUsbTransport({
                    id: TRANSPORT_ID,
                    logger: createLogger?.('@trezor/transport'),
                }),
        };
    };

    const { store, injectServicesIntoReduxExtra } = createReduxStore({
        reducer: rootReducer,
        extraDependencies,
    });
    const db = createDb({ dispatch: store.dispatch, reloadApp });
    const suiteServices = createSuiteServicesCompositionRoot({
        suiteSyncDesktopFactory: createSuiteSyncDesktopCompositionRoot,
        db,
        desktopApi: createWebDesktopApi(),
        dispatch: store.dispatch,
        getState: store.getState,
        history,
        platformEncryption,
        createLogger: createConnectLoggerFactory({ getState: store.getState }),
        getBinFilesBaseUrl: asGetter(() => resolveConnectPath('data')),
        reloadApp,
        thpHostName: getWebThpHostName(),
        getTransportsFactories,
        getTrezorConnect: () => TrezorConnect,
    });
    const preloadStore = createPreloadStore({ db });
    const hydrateReduxStore = createHydrateReduxStore({
        store,
        reducer: rootReducer,
        preloadStore,
        getStatePatch: () => Promise.resolve(undefined),
    });
    const services = { ...suiteServices, store, hydrateReduxStore };
    // Services need the store's dispatch/getState, while Redux thunks need those services in extra.
    // Inject them after construction to break the cycle, before the app can dispatch any actions.
    injectServicesIntoReduxExtra(services);

    return { app: createWebApp({ services }) };
};
