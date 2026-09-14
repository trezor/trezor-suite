import { createBrowserHistory } from 'history';

import { createWebauthnPlatformEncryption } from '@suite/platform-encryption-webauthn';
import { asGetter } from '@suite-common/dependency-injection';
import { type NetworksServices, createNetworksCompositionRoot } from '@suite-common/networks';
import TrezorConnect from '@trezor/connect';
import type { CreateLogger } from '@trezor/connect-common';
import { resolveConnectPath } from '@trezor/env-utils';
import { BridgeTransport } from '@trezor/transport-common';
import { WebUsbTransport } from '@trezor/transport-web';

import { createHydrateReduxStore } from 'src/reducers/createHydrateReduxStore';
import { type SuiteReduxStore, createReduxStore } from 'src/reducers/createReduxStore';
import { rootReducer } from 'src/reducers/store';
import { createConnectLoggerFactory } from 'src/support/createConnectLoggerFactory';
import { createSuiteServicesCompositionRoot } from 'src/support/createSuiteCompositionRoot';
import { extraDependencies } from 'src/support/extraDependencies';

import { type WebApp, createWebApp } from './createWebApp';
import { getWebThpHostName } from './support/getWebThpHostName';

type SuiteWebCompositionRoot = { app: WebApp };

export const createSuiteWebCompositionRoot = (): SuiteWebCompositionRoot => {
    const history = createBrowserHistory();
    const platformEncryption = createWebauthnPlatformEncryption();
    const reloadApp = () => window.location.reload();

    const getTransportsFactories = () => {
        // Pure DI: connect expects ready-made Transport instances, so the host constructs
        // them here. `id` becomes the Bridge session owner shown to the user; it mirrors
        // the web manifest's `appName` (see packages/suite/src/support/services.ts).
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
        createLogger: createConnectLoggerFactory({ getState: store.getState }),
        getBinFilesBaseUrl: asGetter(() => resolveConnectPath('data')),
        reloadApp,
        thpHostName: getWebThpHostName(),
        getTransportsFactories,
        getTrezorConnect: () => TrezorConnect,
    });
    const hydrateReduxStore = createHydrateReduxStore({ store, reducer: rootReducer });
    const services = { ...suiteServices, store, hydrateReduxStore };
    // Services need the store's dispatch/getState, while Redux thunks need those services in extra.
    // Inject them after construction to break the cycle, before the app can dispatch any actions.
    reduxStore.injectServicesIntoReduxExtra(services);

    return { app: createWebApp({ services }) };
};
