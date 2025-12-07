import { Dispatch } from '@reduxjs/toolkit';

import { SecureStorageDep } from '@suite-common/secure-storage';
import { CreateSuiteStorageDep, CreateSuiteSyncOwnerDep } from '@suite-common/suite-sync-storage';
import { EnsureDelegatedIdentityKeyDep, selectAllDeviceOwners } from '@suite-common/wallet-core';

import { SuiteSync } from './SuiteSync';
import { createSuiteSyncStorageRepositoryFactory } from './SuiteSyncStorageRepository';
import {
    EnsureSuiteSyncOwnerDeps,
    createEnsureSuiteSyncOwnerKeys,
} from './device/ensureSuiteSyncOwnerKeys';
import { createSubscribeLabeling } from './labeling/createSubscribeLabeling';
import { createUpdateAccountLabel } from './labeling/updateAccountLabel';
import { createUpdateAddressLabel } from './labeling/updateAddressLabel';
import { createUpdateOutputLabel } from './labeling/updateOutputLabel';
import { createUpdateWalletLabel } from './labeling/updateWalletLabel';
import { createRefreshSuiteSyncKeys } from './refreshSuiteSyncKeys';
import { createChangeRelayUrl } from './relay/changeRelayUrl';
import { DEFAULT_SUITE_SYNC_RELAY_URL } from './relay/relayUrl';
import { createSubscriptionStorage } from './storage/subscriptionStorage';
import { createTurnOffSuiteSyncForWallet } from './storage/turnOffSuiteSyncForWallet';
import { createTurnOnSuiteSyncForWallet } from './storage/turnOnSuiteSyncForWallet';
import { selectSuiteSyncRelayUrl } from './suiteSyncSelectors';
import { createTurnOffSuiteSync } from './turnOffSuiteSync';
import { createTurnOnSuiteSync } from './turnOnSuteSync';

type CreateSuiteSyncCompositionRootDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: EnsureSuiteSyncOwnerDeps['trezorConnect'];
} & EnsureDelegatedIdentityKeyDep &
    CreateSuiteStorageDep &
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

    const refreshSuiteSyncKeys = createRefreshSuiteSyncKeys({
        dispatch: deps.dispatch,
        getState: deps.getState,
        ensureDelegatedIdentityKey: deps.ensureDelegatedIdentityKey,
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
            dispatch: deps.dispatch,
            turnOffSuiteSyncForWallet,
        }),
        turnOnSuiteSync: createTurnOnSuiteSync({
            getState: deps.getState,
            dispatch: deps.dispatch,
        }),
        labeling: {
            updateWalletLabel: createUpdateWalletLabel({
                getState: deps.getState,
                suiteSyncStorageRepository,
            }),
            updateAccountLabel: createUpdateAccountLabel({
                getState: deps.getState,
                suiteSyncStorageRepository,
            }),
            updateOutputLabel: createUpdateOutputLabel({
                getState: deps.getState,
                suiteSyncStorageRepository,
            }),
            updateAddressLabel: createUpdateAddressLabel({
                getState: deps.getState,
                suiteSyncStorageRepository,
            }),
        },
    };
};
