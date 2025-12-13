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

import { GetDeviceForStaticSessionId } from './getDeviceForStaticSessionId';
import { createSubscribeLabeling } from './labeling/subscribeLabeling';
import { createUpdateAccountLabel } from './labeling/updateAccountLabel';
import { createUpdateAddressLabel } from './labeling/updateAddressLabel';
import { createUpdateOutputLabel } from './labeling/updateOutputLabel';
import { createUpdateWalletLabel } from './labeling/updateWalletLabel';
import { createEnsureSuiteSyncOwner } from './owner/ensureSuiteSyncOwner';
import { createLoadSuiteSyncOwnerFromState } from './owner/loadSuiteSyncOwnerFromState';
import {
    RetrieveSuiteSyncOwnerDeps,
    createRetrieveSuiteSyncOwner,
} from './owner/retrieveSuiteSyncOwner';
import { createSaveSuiteSyncOwner } from './owner/saveSuiteSyncOwner';
import { createRefreshSuiteSync } from './refreshSuiteSyncKeys';
import { createChangeRelayUrl } from './relay/changeRelayUrl';
import { DEFAULT_SUITE_SYNC_RELAY_URL } from './relay/relayUrl';
import { createEnsureStorage } from './storage/ensureStorage';
import { createSubscriptionStorage } from './storage/subscriptionStorage';
import { createSuiteSyncStorageRepository } from './storage/suiteSyncStorageRepository';
import { createTurnOffSuiteSyncForWallet } from './storage/turnOffSuiteSyncForWallet';
import { createTurnOnSuiteSyncForWallet } from './storage/turnOnSuiteSyncForWallet';
import { selectSuiteSyncRelayUrl } from './suiteSyncSelectors';
import { createTurnOffSuiteSync } from './turnOffSuiteSync';
import { createTurnOnSuiteSync } from './turnOnSuiteSync';

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

    const ensureSuiteSyncOwner = createEnsureSuiteSyncOwner({
        saveSuiteSyncOwner: createSaveSuiteSyncOwner({
            dispatch: deps.dispatch,
            platformEncryption: deps.platformEncryption,
        }),
        retrieveSuiteSyncOwner: createRetrieveSuiteSyncOwner({
            trezorConnect: deps.trezorConnect,
            createSuiteSyncOwner: deps.createSuiteSyncOwner,
        }),
        loadSuiteSyncOwnerFromState: createLoadSuiteSyncOwnerFromState({
            dispatch: deps.dispatch,
            platformEncryption: deps.platformEncryption,
            getDeviceSuiteSyncOwner: findSuiteSyncOwnerForDeviceStaticId,
        }),
    });

    const refreshSuiteSyncKeys = createRefreshSuiteSync({
        dispatch: deps.dispatch,
        ensureDelegatedIdentityKey: deps.ensureDelegatedIdentityKey,
        ensureSuiteSyncOwner,
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
