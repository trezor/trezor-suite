import { createEvoluDeps, createRun } from '@evolu/web';
import { Dispatch } from '@reduxjs/toolkit';

import { DesktopAnalyticsDep } from '@suite/analytics';
import { EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { PlatformEncryptionDep } from '@suite-common/platform-encryption';
import {
    createSuiteSyncCompositionRoot,
    createSuiteSyncErrorHandler,
} from '@suite-common/suite-sync';
import {
    createEvoluErrorHandler,
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import { SuiteSync, SuiteSyncAppReloaderDep } from '@suite-common/suite-sync-types';
import { TrezorConnect } from '@trezor/connect';

import {
    DisableLegacyMetadataIfNeededDep,
    createTurnOnDesktopSuiteSync,
} from './turnOnDesktopSuiteSync';

type SuiteSyncDesktopCompositionRootDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: TrezorConnect;
} & PlatformEncryptionDep &
    EnsureDelegatedIdentityKeyDep &
    DesktopAnalyticsDep &
    DisableLegacyMetadataIfNeededDep &
    SuiteSyncAppReloaderDep;

export const createSuiteSyncDesktopCompositionRoot = (
    deps: SuiteSyncDesktopCompositionRootDeps,
): SuiteSync => {
    const evoluDeps = createEvoluDeps();
    const run = createRun(evoluDeps);

    const suiteSyncErrorHandler = createSuiteSyncErrorHandler({ dispatch: deps.dispatch });
    evoluDeps.evoluError.subscribe(
        createEvoluErrorHandler(evoluDeps.evoluError, suiteSyncErrorHandler),
    );

    // This sets up Evolu as a SuiteSync Storage. We provide a factory that
    // accepts `suiteSyncErrorHandler` and creates the evolu instance accordingly.
    const suiteSync = createSuiteSyncCompositionRoot({
        ...deps,
        createSuiteStorage: createEvoluStorageFactory({
            createEvoluInstance: createEvoluInstanceFactory({ run }),
        }),
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
    });

    return {
        ...suiteSync,
        turnOnSuiteSync: createTurnOnDesktopSuiteSync({
            turnOnSuiteSync: suiteSync.turnOnSuiteSync,
            analytics: deps.analytics,
            disableLegacyMetadataIfNeeded: deps.disableLegacyMetadataIfNeeded,
        }),
    };
};
