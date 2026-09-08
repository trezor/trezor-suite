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

import { type NativeInit, createNativeInit } from './createNativeInit';

type SuiteNativeCompositionRoot = {
    init: NativeInit;
};

export const createSuiteNativeCompositionRoot = (
    // Detox passes a serialized value, but react-native-launch-arguments parses it into an object.
    preloadedState = launchArguments.preloadedState as PreloadedState,
): SuiteNativeCompositionRoot => {
    const ensureEncryptionKey = createEnsureEncryptionKey();
    const mmkvStorage = createMMKVStorage({ ensureEncryptionKey });
    const { store, injectServicesIntoReduxExtra } = createReduxStore({
        reducer: prepareRootReducers({ mmkvStorage }),
        extraDependencies,
        preloadedState,
    });
    const nativeServices = createNativeServicesCompositionRoot({
        dispatch: store.dispatch,
        getState: store.getState,
        ensureEncryptionKey,
        mmkvStorage,
    });
    const storePersistor = createStorePersistor({ store });
    const hydrateReduxStore = createHydrateReduxStore({ storePersistor });
    const services = { ...nativeServices, store, storePersistor, hydrateReduxStore };

    // Services need the store's dispatch/getState, while Redux thunks need those services in extra.
    // Inject them after construction to break the cycle, before init starts persistence.
    injectServicesIntoReduxExtra(services);

    return { init: createNativeInit({ services }) };
};
