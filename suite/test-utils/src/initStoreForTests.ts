import { createMemoryHistory } from 'history';

import { PreloadedState, Store, initStore } from '@trezor/suite';
// TODO fix deep import
// eslint-disable-next-line local-rules/no-package-deep-imports
import { createSuiteRouterHistory } from '@trezor/suite/src/support/extraDependencies';

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
            reloadApp: () => {}, // Mock for tests - noop function
        },
        undefined,
        { statePatch: preloadedState },
    );

    return {
        store,
        suiteRouterHistory,
        memoryHistory,
    };
};

export type TestStore = Store;
