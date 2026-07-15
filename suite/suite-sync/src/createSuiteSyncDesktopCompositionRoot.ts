import { type Dispatch } from '@reduxjs/toolkit';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { selectIsTorEnabled } from '@suite/tor';
import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { toGetter } from '@suite-common/dependency-injection';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import {
    createSuiteSyncCompositionRoot,
    createUpdateRelayConnectionStatus,
} from '@suite-common/suite-sync';
import { evoluCreateSuiteSyncOwner } from '@suite-common/suite-sync-evolu';
import { type FetchDep } from '@suite-common/suite-sync-quota-manager';
import { type OnStorageEnsured, type SuiteSync } from '@suite-common/suite-sync-types';
import { type TrezorConnectPrivilegedAPI } from '@trezor/connect';

import { createEvoluDeps } from './evolu/createEvoluDeps';
import { suiteSyncErrorHandler } from './suiteSyncErrorHandler';
import { createTurnOnDesktopSuiteSync } from './turnOnDesktopSuiteSync';

type SuiteSyncDesktopCompositionRootDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: TrezorConnectPrivilegedAPI;
    onStorageEnsured: OnStorageEnsured;
} & PlatformEncryptionDep &
    EnsureDelegatedIdentityKeyDep &
    DesktopAnalyticsDep &
    FetchDep;

export const createSuiteSyncDesktopCompositionRoot = (
    deps: SuiteSyncDesktopCompositionRootDeps,
): SuiteSync => {
    const updateRelayConnectionStatus = createUpdateRelayConnectionStatus({
        dispatch: deps.dispatch,
    });
    const { createSuiteStorage, subscribeError } = createEvoluDeps({
        dispatch: deps.dispatch,
        updateRelayConnectionStatus,
    });

    // This sets up Evolu as a SuiteSync Storage. We provide a factory that
    // accepts `suiteSyncErrorHandler` and creates the evolu instance accordingly.
    const suiteSync = createSuiteSyncCompositionRoot({
        ...deps,
        createSuiteStorage,
        createSuiteSyncOwner: evoluCreateSuiteSyncOwner,
        getIsTorEnabled: toGetter(deps.getState, selectIsTorEnabled),
        analytics: deps.analytics,
        subscribeError,
        suiteSyncUncontrolledErrorHandler: ({ device, error }) =>
            suiteSyncErrorHandler({
                error,
                dispatch: deps.dispatch,
                deviceStaticSessionId: device?.state?.staticSessionId ?? null,
            }),
    });

    return {
        ...suiteSync,
        turnOnSuiteSync: createTurnOnDesktopSuiteSync({
            turnOnSuiteSync: suiteSync.turnOnSuiteSync,
            analytics: deps.analytics,
        }),
    };
};
