import { evoluWebDeps } from '@evolu/web';
import { type Dispatch } from '@reduxjs/toolkit';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { createSuiteSyncCompositionRoot } from '@suite-common/suite-sync';
import {
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import { type SuiteSync, type SuiteSyncAppReloaderDep } from '@suite-common/suite-sync-types';
import { type TrezorConnect } from '@trezor/connect';

import {
    type DisableLegacyMetadataIfNeededDep,
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
    // This sets up Evolu as a SuiteSync Storage. We provide a factory that
    // accepts `suiteSyncErrorHandler` and creates the evolu instance accordingly.
    const suiteSync = createSuiteSyncCompositionRoot({
        ...deps,
        createSuiteStorageFactory: ({ suiteSyncErrorHandler }) => {
            const createEvoluInstance = createEvoluInstanceFactory({
                evoluDeps: evoluWebDeps,
                suiteSyncErrorHandler,
            });

            return createEvoluStorageFactory({ createEvoluInstance });
        },
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
        analytics: deps.analytics,
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
