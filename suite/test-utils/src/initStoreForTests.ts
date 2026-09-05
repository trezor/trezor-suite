import { type MemoryHistory, createMemoryHistory } from 'history';

import { type SuiteRouterHistory, createSuiteRouterHistory } from '@suite/router';
import { asGetter } from '@suite-common/dependency-injection';
import { asEncryptedHex } from '@suite-common/platform-encryption';
import {
    type EncryptableBranded,
    type EncryptedHex,
    type PlatformEncryption,
} from '@suite-common/platform-encryption';
import { type PreloadedState, type SuiteStore, initStore } from '@trezor/suite';
import { type DeepPartial, ok } from '@trezor/type-utils';

const testPlatformEncryption: PlatformEncryption = {
    encrypt<T extends EncryptableBranded>({ value }: { value: T }) {
        return Promise.resolve(ok(asEncryptedHex<T>(value as string)));
    },

    decrypt<T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) {
        return Promise.resolve(ok(value as unknown as T));
    },
};

export type TestStore = SuiteStore['store'];

export type InitStoreForTestsResult = {
    store: TestStore;
    services: SuiteStore['services'];
    suiteRouterHistory: SuiteRouterHistory;
    memoryHistory: MemoryHistory;
    platformEncryption: PlatformEncryption;
};

/**
 * Test-friendly wrapper for initStore that provides necessary dependencies like history.
 * Returns both the store and history for test assertions.
 */
export const initStoreForTests = (
    preloadedState: DeepPartial<PreloadedState> = {},
): InitStoreForTestsResult => {
    const memoryHistory = createMemoryHistory();
    const suiteRouterHistory = createSuiteRouterHistory({ history: memoryHistory });

    const { store, services } = initStore(
        {
            history: memoryHistory,
            platformEncryption: testPlatformEncryption,
            reloadApp: () => {},
            getTransportsFactories: () => ({}),
            createGetBinFilesBaseUrl: () => asGetter(() => '/bin'),
        },
        // A benign preload action: initStore merges `statePatch` only when a preload action
        // produced a base state, and an action type unknown to every reducer produces exactly the
        // initial state — hence the cast to the storage-action union.
        { type: '@@test/preload' } as unknown as Parameters<typeof initStore>[1],
        { statePatch: preloadedState },
    );

    return {
        store,
        services,
        suiteRouterHistory,
        memoryHistory,
        platformEncryption: testPlatformEncryption,
    };
};
