import { evoluReactNativeDeps } from '@evolu/react-native/expo-sqlite';

import { DEFAULT_SUITE_SYNC_RELAY_URL, createInitSuiteSync } from '@suite-common/suite-sync';
import {
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import { createSuiteSyncStorageRepositoryFactory } from '@suite-common/suite-sync-storage';
export { useSuiteSyncAlerts } from './hooks/useSuiteSyncAlerts';

type InitSuiteSyncNativeDeps = {
    getState: () => any;
};

export const initSuiteSyncNative = ({ getState }: InitSuiteSyncNativeDeps) => {
    const createEvoluInstance = createEvoluInstanceFactory(evoluReactNativeDeps);
    const createEvoluStorage = createEvoluStorageFactory({ createEvoluInstance });

    const createSuiteSyncStorageRepository = createSuiteSyncStorageRepositoryFactory({
        createSuiteStorage: createEvoluStorage,
        defaultRelayUrl: DEFAULT_SUITE_SYNC_RELAY_URL,
    });

    return createInitSuiteSync({
        getState,
        createSuiteSyncStorageRepository,
    });
};

export const createSuiteSyncOwnerNative = evoluCreateSuiteSyncOwner;
