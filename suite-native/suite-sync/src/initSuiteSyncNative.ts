import { evoluReactNativeDeps } from '@evolu/react-native/expo-sqlite';
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

type InitSuiteSyncNativeDeps = {
    getState: () => any;
    dispatch: Dispatch;
    secureStorage: SecureStorage;
    trezorConnect: TrezorConnect;
};

export const initSuiteSyncNative = (deps: InitSuiteSyncNativeDeps): SuiteSync => {
    const createEvoluInstance = createEvoluInstanceFactory(evoluReactNativeDeps);
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
