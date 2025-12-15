import { evoluWebDeps } from '@evolu/web';
import { Dispatch } from '@reduxjs/toolkit';

import { EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { createSuiteSyncCompositionRoot } from '@suite-common/suite-sync';
import {
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import { SuiteSync, SuiteSyncListenerDep } from '@suite-common/suite-sync-types';
import { TrezorConnect } from '@trezor/connect';

type SuiteSyncDesktopCompositionRootDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: TrezorConnect;
} & PlatformEncryptionDep &
    EnsureDelegatedIdentityKeyDep &
    SuiteSyncListenerDep;

export const createSuiteSyncDesktopCompositionRoot = (
    deps: SuiteSyncDesktopCompositionRootDeps,
): SuiteSync => {
    // This is the place where we set Evolu as a SuiteSync Storage.
    const createEvoluInstance = createEvoluInstanceFactory(evoluWebDeps);
    const createEvoluStorage = createEvoluStorageFactory({ createEvoluInstance });

    return createSuiteSyncCompositionRoot({
        ...deps,
        suiteSyncListener: deps.suiteSyncListener,
        createSuiteStorage: createEvoluStorage,
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
    });
};
