import { createMemoryHistory } from 'history';

import { createSuiteRouterHistory } from '@suite/router';
import { type PreloadedState, type Store, initStore } from '@trezor/suite';

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
