import {
    LocalFirstStorageProvider,
    SuiteStorageCreator,
    setLocalFirstStorageProvider,
} from '@suite-common/suite-sync-storage';

import {
    selectIsLocalFirstStorageEnabled,
    selectLocalFirstStorageRelayUrl,
} from './suiteSyncSelectors';

type InitSuiteSyncDeps = {
    storageFactory: SuiteStorageCreator;
    getState: () => any;
};

export const initSuiteSync = (deps: InitSuiteSyncDeps) => {
    const isLocalFirstStorageEnabled = selectIsLocalFirstStorageEnabled(deps.getState());

    if (!isLocalFirstStorageEnabled) {
        return;
    }

    const relayUrl = selectLocalFirstStorageRelayUrl(deps.getState());

    setLocalFirstStorageProvider(new LocalFirstStorageProvider(relayUrl, deps.storageFactory));
};
