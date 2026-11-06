import { type SuiteSyncDesktopFactory, suiteSyncErrorHandler } from '@suite/suite-sync';
import { selectIsTorEnabled } from '@suite/tor';
import {
    createSuiteSyncCompositionRoot,
    createUpdateRelayConnectionStatus,
} from '@suite-common/suite-sync';
import { evoluCreateSuiteSyncOwner } from '@suite-common/suite-sync-evolu';
import { toGetter } from '@trezor/dependency-injection';

import { createEvoluDeps } from './evolu/createEvoluDeps';
import { createTurnOnDesktopSuiteSync } from './turnOnDesktopSuiteSync';

export const createSuiteSyncDesktopCompositionRoot: SuiteSyncDesktopFactory = deps => {
    const updateRelayConnectionStatus = createUpdateRelayConnectionStatus({
        dispatch: deps.dispatch,
    });
    const { createSuiteStorage, subscribeError } = createEvoluDeps({
        dispatch: deps.dispatch,
        updateRelayConnectionStatus,
    });

    // This sets up Evolu as a SuiteSync Storage. We provide a factory that
    // accepts `suiteSyncErrorHandler` and creates the evolu instance accordingly.
    const suiteSync = createSuiteSyncCompositionRoot({
        ...deps,
        createSuiteStorage,
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
        getIsTorEnabled: toGetter(deps.getState, selectIsTorEnabled),
        analytics: deps.analytics,
        subscribeError,
        suiteSyncUncontrolledErrorHandler: ({ device, error }) =>
            suiteSyncErrorHandler({
                error,
                dispatch: deps.dispatch,
                deviceStaticSessionId: device?.state?.staticSessionId ?? null,
            }),
    });

    return {
        ...suiteSync,
        turnOnSuiteSync: createTurnOnDesktopSuiteSync({
            turnOnSuiteSync: suiteSync.turnOnSuiteSync,
            analytics: deps.analytics,
        }),
    };
};
