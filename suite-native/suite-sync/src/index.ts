import { evoluReactNativeDeps } from '@evolu/react-native/expo-sqlite';

import { DEFAULT_SUITE_SYNC_RELAY_URL, initSuiteSync } from '@suite-common/suite-sync';
import { evoluCreateSuiteSyncOwner, evoluStorageCreator } from '@suite-common/suite-sync-evolu';
export { useSuiteSyncAlerts } from './hooks/useSuiteSyncAlerts';

type InitSuiteSyncNativeDeps = {
    getState: () => any;
};

export const initSuiteSyncNative = ({ getState }: InitSuiteSyncNativeDeps) =>
    initSuiteSync({
        getState,
        storageFactory: evoluStorageCreator(evoluReactNativeDeps, DEFAULT_SUITE_SYNC_RELAY_URL),
    });

export const createSuiteSyncOwnerNative = evoluCreateSuiteSyncOwner;
