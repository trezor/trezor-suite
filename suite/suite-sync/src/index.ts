import { evoluWebDeps } from '@evolu/web';

import { DEFAULT_SUITE_SYNC_RELAY_URL, initSuiteSync } from '@suite-common/suite-sync';
import { evoluCreateSuiteSyncOwner, evoluStorageCreator } from '@suite-common/suite-sync-evolu';

type InitSuiteSyncDesktopDeps = {
    getState: () => any;
};

export const initSuiteSyncDesktop =
    ({ getState }: InitSuiteSyncDesktopDeps) =>
    () =>
        initSuiteSync({
            getState,
            storageFactory: evoluStorageCreator(evoluWebDeps, DEFAULT_SUITE_SYNC_RELAY_URL),
        });

export const createSuiteSyncOwnerDesktop = evoluCreateSuiteSyncOwner;
