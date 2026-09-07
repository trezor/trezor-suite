import { type MemoryHistory, createMemoryHistory } from 'history';

import { type SuiteRouterHistory, createSuiteRouterHistory } from '@suite/router';
import { asGetter } from '@suite-common/dependency-injection';
import { asEncryptedHex } from '@suite-common/platform-encryption';
import {
    type EncryptableBranded,
    type EncryptedHex,
    type PlatformEncryption,
} from '@suite-common/platform-encryption';
import {
    type AppState,
    type PreloadStoreAction,
    type SuiteReduxStore,
    createHydrateReduxStore,
    createReduxStore,
    createSuiteServicesCompositionRoot,
    extraDependencies,
    rootReducer,
} from '@trezor/suite';
import { type DeepPartial, ok } from '@trezor/type-utils';

const testPlatformEncryption: PlatformEncryption = {
    encrypt<T extends EncryptableBranded>({ value }: { value: T }) {
        return Promise.resolve(ok(asEncryptedHex<T>(value as string)));
    },

    decrypt<T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) {
        return Promise.resolve(ok(value as unknown as T));
    },
};

export type PreloadedState = Partial<AppState>;
export type TestStore = SuiteReduxStore;

export type InitStoreForTestsResult = {
    store: TestStore;
    suiteRouterHistory: SuiteRouterHistory;
    memoryHistory: MemoryHistory;
    platformEncryption: PlatformEncryption;
};

/**
 * Creates a Redux store with test dependencies and hydrates it with the supplied state.
 * Returns both the store and history for test assertions.
 */
export const initStoreForTests = (
    preloadedState: DeepPartial<PreloadedState> = {},
): InitStoreForTestsResult => {
    const memoryHistory = createMemoryHistory();
    const suiteRouterHistory = createSuiteRouterHistory({ history: memoryHistory });

    const { store, injectServicesIntoReduxExtra } = createReduxStore({
        reducer: rootReducer,
        extraDependencies,
    });
    const suiteServices = createSuiteServicesCompositionRoot({
        dispatch: store.dispatch,
        getState: store.getState,
        history: memoryHistory,
        platformEncryption: testPlatformEncryption,
        reloadApp: () => {},
        getTransportsFactories: () => ({}),
        getBinFilesBaseUrl: asGetter(() => '/bin'),
    });
    const hydrateReduxStore = createHydrateReduxStore({ store, reducer: rootReducer });
    const services = { ...suiteServices, store, hydrateReduxStore };
    injectServicesIntoReduxExtra(services);

    // An action unknown to every reducer produces the initial state before applying the patch.
    // The production hydration service accepts only storage actions, hence the cast.
    hydrateReduxStore({ type: '@@test/preload' } as unknown as PreloadStoreAction, preloadedState);

    return {
        store,
        suiteRouterHistory,
        memoryHistory,
        platformEncryption: testPlatformEncryption,
    };
};
