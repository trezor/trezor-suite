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
import { ok } from '@trezor/type-utils';

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
    suiteRouterHistory: SuiteRouterHistory;
    memoryHistory: MemoryHistory;
    platformEncryption: PlatformEncryption;
};

/**
 * Test-friendly wrapper for initStore that provides necessary dependencies like history.
 * Returns both the store and history for test assertions.
 */
export const initStoreForTests = (preloadedState: PreloadedState = {}): InitStoreForTestsResult => {
    const memoryHistory = createMemoryHistory();
    const suiteRouterHistory = createSuiteRouterHistory({ history: memoryHistory });

    const { store } = initStore(
        {
            history: memoryHistory,
            platformEncryption: testPlatformEncryption,
            reloadApp: () => {},
            getTransportsFactories: () => ({}),
            createGetBinFilesBaseUrl: () => asGetter(() => '/bin'),
        },
        undefined,
        { statePatch: preloadedState },
    );

    return {
        store,
        suiteRouterHistory,
        memoryHistory,
        platformEncryption: testPlatformEncryption,
    };
};
