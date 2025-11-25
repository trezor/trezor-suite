import {
    CreateSuiteSyncStorageRepository,
    setSuiteSyncProvider,
} from '@suite-common/suite-sync-storage';

import { selectSuiteSyncRelayUrl } from './suiteSyncSelectors';

export type InitSuiteSync = {
    init: () => void;
};

type InitSuiteSyncDeps = {
    createSuiteSyncStorageRepository: CreateSuiteSyncStorageRepository;
    getState: () => any;
};

export const createInitSuiteSync = (deps: InitSuiteSyncDeps): InitSuiteSync => ({
    init: () => {
        const relayUrl = selectSuiteSyncRelayUrl(deps.getState());
        setSuiteSyncProvider(deps.createSuiteSyncStorageRepository({ relayUrl }));
    },
});
