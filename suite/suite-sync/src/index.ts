import { evoluWebDeps } from '@evolu/web';

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

type InitSuiteSyncDesktopDeps = {
    getState: () => any;
};

export const createSuiteSyncDesktop = (deps: InitSuiteSyncDesktopDeps): SuiteSync => {
    const createEvoluInstance = createEvoluInstanceFactory(evoluWebDeps);
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
