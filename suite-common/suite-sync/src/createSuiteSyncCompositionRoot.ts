import { Dispatch } from '@reduxjs/toolkit';

import {
    CreateSuiteStorage,
    CreateSuiteSyncOwner,
    SuiteSync,
    createSuiteSyncStorageRepositoryFactory,
} from '@suite-common/suite-sync-storage';
import { selectAllDeviceOwners } from '@suite-common/wallet-core';

import { createChangeRelayUrl } from './relay/changeRelayUrl';
import { DEFAULT_SUITE_SYNC_RELAY_URL } from './relay/relayUrl';
import { selectSuiteSyncRelayUrl } from './suiteSyncSelectors';

type CreateSuiteSyncCompositionRootDeps = {
    createSuiteStorage: CreateSuiteStorage;
    createSuiteSyncOwner: CreateSuiteSyncOwner;
    getState: () => any;
    dispatch: Dispatch;
};

export const createSuiteSyncCompositionRoot = (
    deps: CreateSuiteSyncCompositionRootDeps,
): SuiteSync => {
    const suiteSyncStorageRepository = createSuiteSyncStorageRepositoryFactory({
        createSuiteStorage: deps.createSuiteStorage,
        defaultRelayUrl: DEFAULT_SUITE_SYNC_RELAY_URL,
        getRelayUrl: () => selectSuiteSyncRelayUrl(deps.getState()),
    })();

    return {
        changeRelayUrl: createChangeRelayUrl({
            suiteSyncStorageRepository,
            getAllDevicesOwners: () => selectAllDeviceOwners(deps.getState()),
            dispatch: deps.dispatch,
        }),
        suiteSyncStorageRepository,
        createSuiteSyncOwner: deps.createSuiteSyncOwner,
    };
};
