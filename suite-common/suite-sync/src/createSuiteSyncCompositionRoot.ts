import { Dispatch } from '@reduxjs/toolkit';

import { SecureStorageDep } from '@suite-common/secure-storage';
import { CreateSuiteStorageDep, CreateSuiteSyncOwnerDep } from '@suite-common/suite-sync-storage';
// Circular issue, see: https://github.com/trezor/trezor-suite/issues/21553
import { selectThp } from '@suite-common/thp/src/thpSelectors';
import {
    RetrieveDelegatedIdentityKeyFromDeviceDeps,
    createEnsureDelegatedIdentityKey,
    createLoadDelegatedIdentityKeyFromState,
    createRetrieveDelegatedIdentityKeyFromDevice,
    createSaveDelegatedIdentityKey,
    selectAllDeviceOwners,
    selectDeviceDelegatedIdentityKey,
} from '@suite-common/wallet-core';

import { SuiteSync } from './SuiteSync';
import { createSuiteSyncStorageRepositoryFactory } from './SuiteSyncStorageRepository';
import {
    EnsureSuiteSyncOwnerDeps,
    createEnsureSuiteSyncOwnerKeys,
} from './device/ensureSuiteSyncOwnerKeys';
import { createSubscribeLabeling } from './labeling/createSubscribeLabeling';
import { createRefreshSuiteSyncKeys } from './refreshSuiteSyncKeys';
import { createChangeRelayUrl } from './relay/changeRelayUrl';
import { DEFAULT_SUITE_SYNC_RELAY_URL } from './relay/relayUrl';
import { createSubscriptionStorage } from './storage/subscriptionStorage';
import { createTurnOffSuiteSyncForWallet } from './storage/turnOffSuiteSyncForWallet';
import { createTurnOnSuiteSyncForWallet } from './storage/turnOnSuiteSyncForWallet';
import { selectSuiteSyncRelayUrl } from './suiteSyncSelectors';
import { createTurnOffSuiteSync } from './turnOffSuiteSync';

type CreateSuiteSyncCompositionRootDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: EnsureSuiteSyncOwnerDeps['trezorConnect'] &
        RetrieveDelegatedIdentityKeyFromDeviceDeps['trezorConnect'];
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
        retrieveDelegatedIdentityKeyFromDevice: createRetrieveDelegatedIdentityKeyFromDevice({
            trezorConnect: deps.trezorConnect,
        }),
        saveDelegatedIdentityKey: createSaveDelegatedIdentityKey({
            dispatch: deps.dispatch,
            secureStorage: deps.secureStorage,
        }),
        getThpStaticKey: () => selectThp(deps.getState()).staticKey,
    });
    // Todo: ------------------------------------------------------------

    const refreshSuiteSyncKeys = createRefreshSuiteSyncKeys({
        dispatch: deps.dispatch,
        getState: deps.getState,
        ensureDelegatedIdentityKey,
        ensureSuiteSyncOwnerKeys,
    });

    const turnOnSuiteSyncForWallet = createTurnOnSuiteSyncForWallet({
        dispatch: deps.dispatch,
        getState: deps.getState,
        subscribeLabeling,
        refreshSuiteSyncKeys,
    });

    const turnOffSuiteSyncForWallet = createTurnOffSuiteSyncForWallet({
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
        turnOnSuiteSyncForWallet,
        turnOffSuiteSyncForWallet,
        turnOffSuiteSync: createTurnOffSuiteSync({
            getState: deps.getState,
            turnOffSuiteSyncForWallet,
        }),
    };
};
