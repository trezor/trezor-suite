import { Dispatch } from '@reduxjs/toolkit';

import { SecureStorageDep } from '@suite-common/secure-storage';
import {
    CreateSuiteStorageDep,
    CreateSuiteSyncOwnerDep,
    SuiteSync,
    createSuiteSyncStorageRepositoryFactory,
} from '@suite-common/suite-sync-storage';
import {
    createEnsureDelegatedIdentityKey,
    createLoadDelegatedIdentityKeyFromState,
    createSaveDelegatedIdentityKey,
    selectAllDeviceOwners,
    selectDeviceDelegatedIdentityKey,
} from '@suite-common/wallet-core';

import {
    EnsureSuiteSyncOwnerDeps,
    createEnsureSuiteSyncOwnerKeys,
} from './device/ensureSuiteSyncOwnerKeys';
import { createSubscribeLabeling } from './labeling/createSubscribeLabeling';
import { createRefreshSuiteSyncKeys } from './refreshSuiteSyncKeys';
import { createChangeRelayUrl } from './relay/changeRelayUrl';
import { DEFAULT_SUITE_SYNC_RELAY_URL } from './relay/relayUrl';
import { createSubscribeSuiteSyncStorage } from './storage/subscribeSuiteSyncStorage';
import { createSubscriptionStorage } from './storage/subscriptionStorage';
import { createUnsubscribeSuiteSyncStorage } from './storage/unsubscribeSuiteSync';
import { selectSuiteSyncRelayUrl } from './suiteSyncSelectors';
import { createTurnOffSuiteSync } from './turnOffSuiteSync';

type CreateSuiteSyncCompositionRootDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: EnsureSuiteSyncOwnerDeps['trezorConnect'];
} & CreateSuiteStorageDep &
    CreateSuiteSyncOwnerDep &
    SecureStorageDep;

export const createSuiteSyncCompositionRoot = (
    deps: CreateSuiteSyncCompositionRootDeps,
): SuiteSync => {
    const suiteSyncStorageRepository = createSuiteSyncStorageRepositoryFactory({
        createSuiteStorage: deps.createSuiteStorage,
        defaultRelayUrl: DEFAULT_SUITE_SYNC_RELAY_URL,
        getRelayUrl: () => selectSuiteSyncRelayUrl(deps.getState()),
    })();

    const subscriptionStorage = createSubscriptionStorage();

    const subscribeLabeling = createSubscribeLabeling({
        subscriptionStorage,
        dispatch: deps.dispatch,
        suiteSyncStorageRepository,
    });

    const ensureSuiteSyncOwnerKeys = createEnsureSuiteSyncOwnerKeys({
        createSuiteSyncOwner: deps.createSuiteSyncOwner,
        trezorConnect: deps.trezorConnect,
    });

    // Todo: this shall be extracted upstream in the composition root
    const ensureDelegatedIdentityKey = createEnsureDelegatedIdentityKey({
        loadDelegatedIdentityKeyFromState: createLoadDelegatedIdentityKeyFromState({
            dispatch: deps.dispatch,
            secureStorage: deps.secureStorage,
            getDeviceDelegatedIdentityKey: deviceId =>
                selectDeviceDelegatedIdentityKey(deps.getState(), deviceId),
        }),
        saveDelegatedIdentityKey: createSaveDelegatedIdentityKey({
            dispatch: deps.dispatch,
            secureStorage: deps.secureStorage,
        }),
        getState: deps.getState,
    });
    // Todo: ------------------------------------------------------------

    const refreshSuiteSyncKeys = createRefreshSuiteSyncKeys({
        dispatch: deps.dispatch,
        getState: deps.getState,
        ensureDelegatedIdentityKey,
        ensureSuiteSyncOwnerKeys,
    });

    const subscribeSuiteSyncStorage = createSubscribeSuiteSyncStorage({
        dispatch: deps.dispatch,
        getState: deps.getState,
        subscribeLabeling,
        refreshSuiteSyncKeys,
    });

    const unsubscribeSuiteSyncStorage = createUnsubscribeSuiteSyncStorage({
        suiteSyncStorageRepository,
        subscriptionStorage,
    });

    return {
        changeRelayUrl: createChangeRelayUrl({
            suiteSyncStorageRepository,
            getAllDevicesOwners: () => selectAllDeviceOwners(deps.getState()),
            dispatch: deps.dispatch,
        }),
        suiteSyncStorageRepository,
        createSuiteSyncOwner: deps.createSuiteSyncOwner,
        subscribeSuiteSyncStorage,
        unsubscribeSuiteSyncStorage,
        turnOffSuiteSync: createTurnOffSuiteSync({
            getState: deps.getState,
            unsubscribeSuiteSyncStorage,
        }),
    };
};
