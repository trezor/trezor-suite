import { evoluReactNativeDeps } from '@evolu/react-native/expo-sqlite';
import { Dispatch } from '@reduxjs/toolkit';
import { reloadAppAsync } from 'expo';

import { EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { createSuiteSyncCompositionRoot } from '@suite-common/suite-sync';
import {
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import { SuiteSync } from '@suite-common/suite-sync-types';
import { TrezorConnect } from '@trezor/connect';

type SuiteSyncNativeCompositionRootDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: TrezorConnect;
} & PlatformEncryptionDep &
    EnsureDelegatedIdentityKeyDep;

export const createSuiteSyncNativeCompositionRoot = (
    deps: SuiteSyncNativeCompositionRootDeps,
): SuiteSync => {
    const createEvoluInstance = createEvoluInstanceFactory(evoluReactNativeDeps);
    const createEvoluStorage = createEvoluStorageFactory({ createEvoluInstance });

    return createSuiteSyncCompositionRoot({
        ...deps,
        createSuiteStorage: createEvoluStorage,
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
        flushSuiteSyncStorage: reloadAppAsync,
    });
};
