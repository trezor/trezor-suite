import { createRun } from '@evolu/react-native';
import { createEvoluDeps } from '@evolu/react-native/expo-sqlite';
import { Dispatch } from '@reduxjs/toolkit';
import { reloadAppAsync } from 'expo';

import { EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { PlatformEncryptionDep } from '@suite-common/platform-encryption';
import {
    createSuiteSyncCompositionRoot,
    createSuiteSyncErrorHandler,
} from '@suite-common/suite-sync';
import {
    createEvoluErrorHandler,
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
    const evoluDeps = createEvoluDeps();
    const run = createRun(evoluDeps);

    const suiteSyncErrorHandler = createSuiteSyncErrorHandler({ dispatch: deps.dispatch });
    evoluDeps.evoluError.subscribe(
        createEvoluErrorHandler(evoluDeps.evoluError, suiteSyncErrorHandler),
    );

    return createSuiteSyncCompositionRoot({
        ...deps,
        createSuiteStorage: createEvoluStorageFactory({
            createEvoluInstance: createEvoluInstanceFactory({ run }),
        }),
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
        reloadApp: reloadAppAsync,
    });
};
