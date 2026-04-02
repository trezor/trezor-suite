import { createConsole, createConsoleFormatter } from '@evolu/common';
import { createRun } from '@evolu/react-native';
import { createEvoluDeps } from '@evolu/react-native/expo-sqlite';
import { type Dispatch } from '@reduxjs/toolkit';

import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import {
    type SuiteSyncAnalyticsDep,
    type SuiteSyncAsyncErrorHandlerDep,
    createSuiteSyncCompositionRoot,
} from '@suite-common/suite-sync';
import {
    createEvoluErrorHandler,
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    evoluCreateSuiteSyncOwner,
} from '@suite-common/suite-sync-evolu';
import { type FetchDep } from '@suite-common/suite-sync-quota-manager';
import { type SuiteSync } from '@suite-common/suite-sync-types';
import { type TrezorConnect } from '@trezor/connect';

type SuiteSyncNativeCompositionRootDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: TrezorConnect;
} & SuiteSyncAnalyticsDep &
    PlatformEncryptionDep &
    EnsureDelegatedIdentityKeyDep &
    FetchDep &
    SuiteSyncAsyncErrorHandlerDep;

export const createSuiteSyncNativeCompositionRoot = (
    deps: SuiteSyncNativeCompositionRootDeps,
): SuiteSync => {
    const console = createConsole({
        level: 'warn',
        formatter: createConsoleFormatter()({ timestampFormat: 'absolute' }),
    });

    const evoluDeps = createEvoluDeps({ console });
    const run = createRun(evoluDeps);

    return createSuiteSyncCompositionRoot({
        ...deps,
        createSuiteStorage: createEvoluStorageFactory({
            createEvoluInstance: createEvoluInstanceFactory({ run }),
        }),
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
        subscribeError: errorHandler => {
            evoluDeps.evoluError.subscribe(
                createEvoluErrorHandler(evoluDeps.evoluError, errorHandler),
            );
        },
        suiteSyncAsyncErrorHandler: deps.suiteSyncAsyncErrorHandler,
    });
};
