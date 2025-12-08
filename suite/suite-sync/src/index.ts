import { evoluWebDeps } from '@evolu/web';
import { Dispatch } from '@reduxjs/toolkit';

import { SecureStorageDep } from '@suite-common/secure-storage';
import { createSuiteSyncCompositionRoot } from '@suite-common/suite-sync';
import {
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import { SuiteSync } from '@suite-common/suite-sync-types';
import { EnsureDelegatedIdentityKeyDep } from '@suite-common/wallet-core';
import { TrezorConnect } from '@trezor/connect';

type InitSuiteSyncDesktopDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: TrezorConnect;
} & SecureStorageDep &
    EnsureDelegatedIdentityKeyDep;

export const createSuiteSyncDesktopCompositionRoot = (
    deps: InitSuiteSyncDesktopDeps,
): SuiteSync => {
    // This is the place where we set Evolu as a SuiteSync Storage.
    const createEvoluInstance = createEvoluInstanceFactory(evoluWebDeps);
    const createEvoluStorage = createEvoluStorageFactory({ createEvoluInstance });

    return createSuiteSyncCompositionRoot({
        ...deps,
        createSuiteStorage: createEvoluStorage,
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
    });
};
