import { getSupportedNetworks } from '@suite-common/wallet-config';
import { launchArguments } from '@suite-native/config';
import {
    type PreloadedState,
    createHydrateReduxStore,
    createNativeServicesCompositionRoot,
    createReduxStore,
    createStorePersistor,
    extraDependencies,
    prepareRootReducers,
} from '@suite-native/state';
import { createEnsureEncryptionKey, createMMKVStorage } from '@suite-native/storage';
import TrezorConnect from '@trezor/connect';

import { type NativeApp, createNativeApp } from './createNativeApp';

type SuiteNativeCompositionRoot = {
    app: NativeApp;
};

export const createSuiteNativeCompositionRoot = (
    // Detox passes a serialized value, but react-native-launch-arguments parses it into an object.
    preloadedState = launchArguments.preloadedState as PreloadedState,
): SuiteNativeCompositionRoot => {
    const ensureEncryptionKey = createEnsureEncryptionKey();
    const mmkvStorage = createMMKVStorage({ ensureEncryptionKey });
    const { store, injectServicesIntoReduxExtra } = createReduxStore({
        // Passing runtime dependencies into reducer setup is an anti-pattern: reducers should
        // remain pure and receive runtime data through action payloads, not services or extra.
        // This is a temporary workaround for redux-persist coupling storage and the network
        // whitelist to reducer construction, not a pattern to follow for other reducers.
        // See https://github.com/trezor/trezor-suite/issues/32215.
        // Network metadata is loaded after hydration, so it cannot supply this whitelist yet.
        reducer: prepareRootReducers({ mmkvStorage, getSupportedNetworks }),
        extraDependencies,
        preloadedState,
    });
    const nativeServices = createNativeServicesCompositionRoot({
        dispatch: store.dispatch,
        getState: store.getState,
        ensureEncryptionKey,
        mmkvStorage,
        getTrezorConnect: () => TrezorConnect,
    });
    const storePersistor = createStorePersistor({ store });
    const hydrateReduxStore = createHydrateReduxStore({ storePersistor });
    const services = { ...nativeServices, store, storePersistor, hydrateReduxStore };

    // Services need the store's dispatch/getState, while Redux thunks need those services in extra.
    // Inject them after construction to break the cycle, before the app starts persistence.
    injectServicesIntoReduxExtra(services);

    return { app: createNativeApp({ services }) };
};
