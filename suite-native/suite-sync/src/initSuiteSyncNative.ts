import { Dispatch } from '@reduxjs/toolkit';

import { createSuiteSyncCompositionRoot } from '@suite-common/suite-sync';
import { createJazzStorageFactory, jazzCreateSuiteSyncOwner } from '@suite-common/suite-sync-jazz';
import { SuiteSync } from '@suite-common/suite-sync-storage';

import { createJazzInstanceFactory } from './createJazzInstanceNative';

type InitSuiteSyncNativeDeps = {
    getState: () => any;
    dispatch: Dispatch;
};

export const initSuiteSyncNative = (deps: InitSuiteSyncNativeDeps): SuiteSync => {
    // Create Jazz instance factory
    const createJazzInstance = createJazzInstanceFactory();

    // Create Jazz storage factory
    const createJazzStorage = createJazzStorageFactory({ createJazzInstance });

    return createSuiteSyncCompositionRoot({
        getState: deps.getState,
        dispatch: deps.dispatch,
        createSuiteStorage: createJazzStorage,
        createSuiteSyncOwner: jazzCreateSuiteSyncOwner,
    });
};
