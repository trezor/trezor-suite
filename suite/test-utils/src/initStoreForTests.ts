import { createMemoryHistory } from 'history';

import { createSuiteRouterHistory } from '@suite/router';
import { asEncryptedHex } from '@suite-common/platform-encryption';
import {
    type EncryptableBranded,
    type EncryptedHex,
    type PlatformEncryption,
} from '@suite-common/platform-encryption';
import { type PreloadedState, type Store, initStore } from '@trezor/suite';
import { ok } from '@trezor/type-utils';

const testPlatformEncryption: PlatformEncryption = {
    encrypt<T extends EncryptableBranded>({ value }: { value: T }) {
        return Promise.resolve(ok(asEncryptedHex<T>(value as string)));
    },

    decrypt<T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) {
        return Promise.resolve(ok(value as unknown as T));
    },
};

/**
 * Test-friendly wrapper for initStore that provides necessary dependencies like history.
 * Returns both the store and history for test assertions.
 */
export const initStoreForTests = (preloadedState: PreloadedState = {}) => {
    const memoryHistory = createMemoryHistory();
    const suiteRouterHistory = createSuiteRouterHistory({ history: memoryHistory });

    const { store } = initStore(
        {
            history: memoryHistory,
            platformEncryption: testPlatformEncryption,
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

export type TestStore = Store;
