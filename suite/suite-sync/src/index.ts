import { evoluWebDeps } from '@evolu/web';
import { Dispatch } from '@reduxjs/toolkit';

import { SecureStorage } from '@suite-common/secure-storage';
import { createSuiteSyncCompositionRoot } from '@suite-common/suite-sync';
import {
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import { SuiteSync } from '@suite-common/suite-sync-storage';
import { TrezorConnect } from '@trezor/connect';

type InitSuiteSyncDesktopDeps = {
    getState: () => any;
    dispatch: Dispatch;
    secureStorage: SecureStorage;
    trezorConnect: TrezorConnect;
};

export const createSuiteSyncDesktop = (deps: InitSuiteSyncDesktopDeps): SuiteSync => {
    // This is the place where we set Evolu as a SuiteSync Storage.
    const createEvoluInstance = createEvoluInstanceFactory(evoluWebDeps);
    const createEvoluStorage = createEvoluStorageFactory({ createEvoluInstance });

    return createSuiteSyncCompositionRoot({
        getState: deps.getState,
        dispatch: deps.dispatch,
        createSuiteStorage: createEvoluStorage,
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
        secureStorage: deps.secureStorage,
        trezorConnect: deps.trezorConnect,
    });
};
