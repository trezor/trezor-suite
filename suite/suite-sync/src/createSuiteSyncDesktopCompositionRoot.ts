import { createConsole, createConsoleFormatter } from '@evolu/common';
import { createEvoluDeps, createRun } from '@evolu/web';
import { type Dispatch } from '@reduxjs/toolkit';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import {
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

import { createOnSharedWorkerUnsupported } from './createOnSharedWorkerUnsupported';
import { createTurnOnDesktopSuiteSync } from './turnOnDesktopSuiteSync';

type SuiteSyncDesktopCompositionRootDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: TrezorConnect;
} & PlatformEncryptionDep &
    EnsureDelegatedIdentityKeyDep &
    DesktopAnalyticsDep &
    FetchDep &
    SuiteSyncAsyncErrorHandlerDep;

export const createSuiteSyncDesktopCompositionRoot = (
    deps: SuiteSyncDesktopCompositionRootDeps,
): SuiteSync => {
    const console = createConsole({
        level: 'warn',
        formatter: createConsoleFormatter()({ timestampFormat: 'absolute' }),
    });

    const evoluDeps = createEvoluDeps({
        console,
        onSharedWorkerUnsupported: createOnSharedWorkerUnsupported({
            dispatch: deps.dispatch,
        }),
    });

    const run = createRun(evoluDeps);
    // This sets up Evolu as a SuiteSync Storage. We provide a factory that
    // accepts `suiteSyncErrorHandler` and creates the evolu instance accordingly.
    const suiteSync = createSuiteSyncCompositionRoot({
        ...deps,
        createSuiteStorage: createEvoluStorageFactory({
            createEvoluInstance: createEvoluInstanceFactory({ run }),
        }),
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
        analytics: deps.analytics,
        subscribeError: suiteSyncErrorHandler => {
            evoluDeps.evoluError.subscribe(
                createEvoluErrorHandler(evoluDeps.evoluError, suiteSyncErrorHandler),
            );
        },
        suiteSyncAsyncErrorHandler: deps.suiteSyncAsyncErrorHandler,
    });

    return {
        ...suiteSync,
        turnOnSuiteSync: createTurnOnDesktopSuiteSync({
            turnOnSuiteSync: suiteSync.turnOnSuiteSync,
            analytics: deps.analytics,
        }),
    };
};
