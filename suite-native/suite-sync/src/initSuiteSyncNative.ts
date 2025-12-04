import { evoluReactNativeDeps } from '@evolu/react-native/expo-sqlite';
import { Dispatch } from '@reduxjs/toolkit';

import { createSuiteSyncCompositionRoot } from '@suite-common/suite-sync';
import {
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import { SuiteSync } from '@suite-common/suite-sync-storage';

type InitSuiteSyncNativeDeps = {
    getState: () => any;
    dispatch: Dispatch;
};

export const initSuiteSyncNative = (deps: InitSuiteSyncNativeDeps): SuiteSync => {
    const createEvoluInstance = createEvoluInstanceFactory(evoluReactNativeDeps);
    const createEvoluStorage = createEvoluStorageFactory({ createEvoluInstance });

    return createSuiteSyncCompositionRoot({
        getState: deps.getState,
        dispatch: deps.dispatch,
        createSuiteStorage: createEvoluStorage,
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
    });
};
