import { evoluReactNativeDeps } from '@evolu/react-native/expo-sqlite';

import { DEFAULT_SUITE_SYNC_RELAY_URL, selectSuiteSyncRelayUrl } from '@suite-common/suite-sync';
import {
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import {
    SuiteSync,
    createSuiteSyncStorageRepositoryFactory,
} from '@suite-common/suite-sync-storage';
export { useSuiteSyncAlerts } from './hooks/useSuiteSyncAlerts';

type InitSuiteSyncNativeDeps = {
    getState: () => any;
};

export const initSuiteSyncNative = (deps: InitSuiteSyncNativeDeps): SuiteSync => {
    const createEvoluInstance = createEvoluInstanceFactory(evoluReactNativeDeps);
    const createEvoluStorage = createEvoluStorageFactory({ createEvoluInstance });

    const suiteSyncStorageRepository = createSuiteSyncStorageRepositoryFactory({
        createSuiteStorage: createEvoluStorage,
        defaultRelayUrl: DEFAULT_SUITE_SYNC_RELAY_URL,
        getRelayUrl: () => selectSuiteSyncRelayUrl(deps.getState()),
    })();

    return {
        suiteSyncStorageRepository,
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
    };
};

export const createSuiteSyncOwnerNative = evoluCreateSuiteSyncOwner;
