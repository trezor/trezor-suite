import { evoluWebDeps } from '@evolu/web';
import { Dispatch } from '@reduxjs/toolkit';

import { DesktopLegacyAnalyticsDep } from '@suite/analytics';
import { EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { createSuiteSyncCompositionRoot } from '@suite-common/suite-sync';
import {
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import { SuiteSync, SuiteSyncStorageFlusherDep } from '@suite-common/suite-sync-types';
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
    DesktopLegacyAnalyticsDep &
    DisableLegacyMetadataIfNeededDep &
    SuiteSyncStorageFlusherDep;

export const createSuiteSyncDesktopCompositionRoot = (
    deps: SuiteSyncDesktopCompositionRootDeps,
): SuiteSync => {
    // This is the place where we set Evolu as a SuiteSync Storage.
    const createEvoluInstance = createEvoluInstanceFactory(evoluWebDeps);
    const createEvoluStorage = createEvoluStorageFactory({ createEvoluInstance });

    const suiteSync = createSuiteSyncCompositionRoot({
        ...deps,
        createSuiteStorage: createEvoluStorage,
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
    });

    return {
        ...suiteSync,
        turnOnSuiteSync: createTurnOnDesktopSuiteSync({
            turnOnSuiteSync: suiteSync.turnOnSuiteSync,
            legacyAnalytics: deps.legacyAnalytics,
            disableLegacyMetadataIfNeeded: deps.disableLegacyMetadataIfNeeded,
        }),
    };
};
