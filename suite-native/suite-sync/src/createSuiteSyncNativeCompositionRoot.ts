import { evoluReactNativeDeps } from '@evolu/react-native/expo-sqlite';
import { type Dispatch } from '@reduxjs/toolkit';
import { reloadAppAsync } from 'expo';

import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { createSuiteSyncCompositionRoot } from '@suite-common/suite-sync';
import {
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import { type SuiteSync } from '@suite-common/suite-sync-types';
import { type TrezorConnect } from '@trezor/connect';

type SuiteSyncNativeCompositionRootDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: TrezorConnect;
} & PlatformEncryptionDep &
    EnsureDelegatedIdentityKeyDep;

export const createSuiteSyncNativeCompositionRoot = (
    deps: SuiteSyncNativeCompositionRootDeps,
): SuiteSync =>
    createSuiteSyncCompositionRoot({
        ...deps,
        createSuiteStorageFactory: ({ suiteSyncErrorHandler }) => {
            const createEvoluInstance = createEvoluInstanceFactory({
                evoluDeps: evoluReactNativeDeps,
                suiteSyncErrorHandler,
            });

            return createEvoluStorageFactory({ createEvoluInstance });
        },
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
        reloadApp: reloadAppAsync,
    });
