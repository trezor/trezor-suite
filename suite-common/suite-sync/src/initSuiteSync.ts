import {
    SuiteStorageCreator,
    SuiteSyncStorageProvider,
    setSuiteSyncProvider,
} from '@suite-common/suite-sync-storage';

import { selectIsSuiteSyncEnabled, selectSuiteSyncRelayUrl } from './suiteSyncSelectors';

type InitSuiteSyncDeps = {
    storageFactory: SuiteStorageCreator;
    getState: () => any;
};

export const initSuiteSync = (deps: InitSuiteSyncDeps) => {
    const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(deps.getState());

    if (!isSuiteSyncEnabled) {
        return;
    }

    const relayUrl = selectSuiteSyncRelayUrl(deps.getState());

    setSuiteSyncProvider(new SuiteSyncStorageProvider(relayUrl, deps.storageFactory));
};
