import { createRun } from '@evolu/react-native';
import { createEvoluDeps } from '@evolu/react-native/expo-sqlite';
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
    const run = createRun(createEvoluDeps());

    return createSuiteSyncCompositionRoot({
        ...deps,
        createSuiteStorageFactory: ({ suiteSyncErrorHandler }) => {
            const createEvoluInstance = createEvoluInstanceFactory({
                run,
                suiteSyncErrorHandler,
            });

            return createEvoluStorageFactory({ createEvoluInstance });
        },
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
        reloadApp: reloadAppAsync,
    });
};
