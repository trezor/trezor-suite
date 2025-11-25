import { evoluWebDeps } from '@evolu/web';

import { DEFAULT_SUITE_SYNC_RELAY_URL, createInitSuiteSync } from '@suite-common/suite-sync';
import {
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import { createSuiteSyncStorageRepositoryFactory } from '@suite-common/suite-sync-storage';

type InitSuiteSyncDesktopDeps = {
    getState: () => any;
};

export const initSuiteSyncDesktop = ({ getState }: InitSuiteSyncDesktopDeps) => {
    const createEvoluInstance = createEvoluInstanceFactory(evoluWebDeps);
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

export const createSuiteSyncOwnerDesktop = evoluCreateSuiteSyncOwner;
