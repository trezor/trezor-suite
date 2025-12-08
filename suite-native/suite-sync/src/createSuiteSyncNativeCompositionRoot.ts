import { evoluReactNativeDeps } from '@evolu/react-native/expo-sqlite';
import { Dispatch } from '@reduxjs/toolkit';

import { SecureStorageDep } from '@suite-common/secure-storage';
import { SuiteSync, createSuiteSyncCompositionRoot } from '@suite-common/suite-sync';
import {
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import { EnsureDelegatedIdentityKeyDep , selectAllDeviceOwners } from '@suite-common/wallet-core';
import { TrezorConnect } from '@trezor/connect';

type InitSuiteSyncNativeDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: TrezorConnect;
} & SecureStorageDep &
    EnsureDelegatedIdentityKeyDep;

export const createSuiteSyncNativeCompositionRoot = (deps: InitSuiteSyncNativeDeps): SuiteSync => {
    const createEvoluInstance = createEvoluInstanceFactory(evoluReactNativeDeps);
    const createEvoluStorage = createEvoluStorageFactory({ createEvoluInstance });

    return createSuiteSyncCompositionRoot({
        ...deps,
        createSuiteStorage: createEvoluStorage,
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
        getAllDevicesOwners: () => selectAllDeviceOwners(deps.getState()),
    });
};
