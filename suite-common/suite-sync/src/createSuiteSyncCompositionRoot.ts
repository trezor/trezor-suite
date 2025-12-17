import { Dispatch } from '@reduxjs/toolkit';

import { EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { CreateSuiteStorageDep, CreateSuiteSyncOwnerDep } from '@suite-common/suite-sync-storage';
import { SuiteSync } from '@suite-common/suite-sync-types';
import {
    selectAllDeviceStaticIds,
    selectDeviceByStaticSessionId,
    selectSuiteSyncOwnerForDeviceStaticId,
} from '@suite-common/wallet-core';
import { StaticSessionId } from '@trezor/connect';

import { createRefreshSuiteSync } from './createRefreshSuiteSyncKeys';
import { createTurnOffSuiteSync } from './createTurnOffSuiteSync';
import { createTurnOnSuiteSync } from './createTurnOnSuiteSync';
import { GetDeviceForStaticSessionId } from './getDeviceForStaticSessionId';
import { createSubscribeLabeling } from './labeling/createSubscribeLabeling';
import { createUpdateAccountLabel } from './labeling/createUpdateAccountLabel';
import { createUpdateAddressLabel } from './labeling/createUpdateAddressLabel';
import { createUpdateOutputLabel } from './labeling/createUpdateOutputLabel';
import { createUpdateWalletLabel } from './labeling/createUpdateWalletLabel';
import { createEnsureSuiteSyncOwner } from './owner/createEnsureSuiteSyncOwner';
import { createLoadSuiteSyncOwnerFromState } from './owner/createLoadSuiteSyncOwnerFromState';
import {
    RetrieveSuiteSyncOwnerDeps,
    createRetrieveSuiteSyncOwner,
} from './owner/createRetrieveSuiteSyncOwner';
import { createSaveSuiteSyncOwner } from './owner/createSaveSuiteSyncOwner';
import { createChangeRelayUrl } from './relay/createChangeRelayUrl';
import { DEFAULT_SUITE_SYNC_RELAY_URL } from './relay/relayUrl';
import { createEnsureStorage } from './storage/createEnsureStorage';
import { createSubscriptionStorage } from './storage/createSubscriptionStorage';
import { createSuiteSyncStorageRepository } from './storage/createSuiteSyncStorageRepository';
import { createTurnOffSuiteSyncForWallet } from './storage/createTurnOffSuiteSyncForWallet';
import { createTurnOnSuiteSyncForWallet } from './storage/createTurnOnSuiteSyncForWallet';
import { selectSuiteSyncRelayUrl } from './suiteSyncSelectors';

type CreateSuiteSyncCompositionRootDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: RetrieveSuiteSyncOwnerDeps['trezorConnect'];
} & EnsureDelegatedIdentityKeyDep &
    CreateSuiteStorageDep &
    CreateSuiteSyncOwnerDep &
    PlatformEncryptionDep;

export const createSuiteSyncCompositionRoot = (
    deps: CreateSuiteSyncCompositionRootDeps,
): SuiteSync => {
    const suiteSyncStorageRepository = createSuiteSyncStorageRepository();

    const subscriptionStorage = createSubscriptionStorage();

    const findSuiteSyncOwnerForDeviceStaticId = (deviceStaticId: StaticSessionId) =>
        selectSuiteSyncOwnerForDeviceStaticId(deps.getState(), deviceStaticId);

    const loadSuiteSyncOwnerFromState = createLoadSuiteSyncOwnerFromState({
        dispatch: deps.dispatch,
        platformEncryption: deps.platformEncryption,
        getDeviceSuiteSyncOwner: findSuiteSyncOwnerForDeviceStaticId,
    });

    const ensureSuiteSyncOwner = createEnsureSuiteSyncOwner({
        saveSuiteSyncOwner: createSaveSuiteSyncOwner({
            dispatch: deps.dispatch,
            platformEncryption: deps.platformEncryption,
        }),
        retrieveSuiteSyncOwner: createRetrieveSuiteSyncOwner({
            trezorConnect: deps.trezorConnect,
            createSuiteSyncOwner: deps.createSuiteSyncOwner,
        }),
        loadSuiteSyncOwnerFromState,
    });

    const refreshSuiteSyncKeys = createRefreshSuiteSync({
        dispatch: deps.dispatch,
        ensureDelegatedIdentityKey: deps.ensureDelegatedIdentityKey,
        ensureSuiteSyncOwner,
        loadSuiteSyncOwnerFromState,
    });

    const getDeviceForStaticSessionId: GetDeviceForStaticSessionId = deviceStaticId =>
        selectDeviceByStaticSessionId(deps.getState(), deviceStaticId) ?? null;

    const ensureStorage = createEnsureStorage({
        refreshSuiteSyncKeys,
        suiteSyncStorageRepository,
        createSuiteStorage: deps.createSuiteStorage,
        defaultRelayUrl: DEFAULT_SUITE_SYNC_RELAY_URL,
        getRelayUrl: () => selectSuiteSyncRelayUrl(deps.getState()),
        getDeviceForStaticSessionId,
    });

    const subscribeLabeling = createSubscribeLabeling({
        subscriptionStorage,
        dispatch: deps.dispatch,
        ensureStorage,
    });

    const turnOnSuiteSyncForWallet = createTurnOnSuiteSyncForWallet({
        dispatch: deps.dispatch,
        getState: deps.getState,
        refreshSuiteSyncKeys,
        subscribeLabeling,
    });

    const turnOffSuiteSyncForWallet = createTurnOffSuiteSyncForWallet({
        suiteSyncStorageRepository,
        subscriptionStorage,
    });

    const getAllDeviceSessionIds = () => selectAllDeviceStaticIds(deps.getState());

    return {
        changeRelayUrl: createChangeRelayUrl({
            suiteSyncStorageRepository,
            getAllDeviceSessionIds,
            dispatch: deps.dispatch,
        }),
        turnOnSuiteSyncForWallet,
        turnOffSuiteSyncForWallet,
        turnOffSuiteSync: createTurnOffSuiteSync({
            getAllDeviceSessionIds,
            dispatch: deps.dispatch,
            getState: deps.getState,
            turnOffSuiteSyncForWallet,
        }),
        turnOnSuiteSync: createTurnOnSuiteSync({
            getState: deps.getState,
            dispatch: deps.dispatch,
            turnOnSuiteSyncForWallet,
        }),
        labeling: {
            updateWalletLabel: createUpdateWalletLabel({ ensureStorage }),
            updateAccountLabel: createUpdateAccountLabel({ ensureStorage }),
            updateOutputLabel: createUpdateOutputLabel({ ensureStorage }),
            updateAddressLabel: createUpdateAddressLabel({ ensureStorage }),
        },
    };
};
