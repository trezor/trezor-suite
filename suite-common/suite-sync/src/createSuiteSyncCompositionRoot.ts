import { Dispatch } from '@reduxjs/toolkit';

import { EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { toGetter } from '@suite-common/dependency-injection';
import { PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { selectHasDeviceAllowance } from '@suite-common/suite-sync-quota-manager';
import { CreateSuiteStorage, CreateSuiteSyncOwnerDep } from '@suite-common/suite-sync-storage';
import {
    SuiteSync,
    SuiteSyncAppReloaderDep,
    SuiteSyncErrorHandler,
} from '@suite-common/suite-sync-types';
import {
    selectAllDeviceStaticIds,
    selectDeviceByStaticSessionId,
    selectSuiteSyncOwnerForDeviceStaticId,
} from '@suite-common/wallet-core';
import { StaticSessionId } from '@trezor/connect';

import { createRefreshSuiteSync } from './createRefreshSuiteSyncKeys';
import { createSuiteSyncErrorHandler } from './createSuiteSyncErrorHandler';
import { createTurnOffSuiteSync } from './createTurnOffSuiteSync';
import { createTurnOnSuiteSync } from './createTurnOnSuiteSync';
import { createEnsureSubscribeSuiteSyncData } from './data/createEnsureSubscribeSuiteSyncData';
import { createSuiteSyncListener } from './data/createSuiteSyncListener';
import { createUpdateAccountLabel } from './data/labeling/createUpdateAccountLabel';
import { createUpdateAddressLabel } from './data/labeling/createUpdateAddressLabel';
import { createUpdateOutputLabel } from './data/labeling/createUpdateOutputLabel';
import { createUpdateWalletLabel } from './data/labeling/createUpdateWalletLabel';
import { GetDeviceForStaticSessionId } from './getDeviceForStaticSessionId';
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
import { createEnsureWalletSuiteSyncOn } from './storage/createEnsureWalletSuiteSyncOn';
import { createEnsureWalletSuiteSyncOnWithErrorHandler } from './storage/createEnsureWalletSuiteSyncOnWithErrorHandler';
import { createSubscriptionStorage } from './storage/createSubscriptionStorage';
import { createSuiteSyncStorageRepository } from './storage/createSuiteSyncStorageRepository';
import { createTurnOffSuiteSyncForWallet } from './storage/createTurnOffSuiteSyncForWallet';
import { selectIsSuiteSyncEnabled, selectSuiteSyncRelayUrl } from './suiteSyncSelectors';

type CreateSuiteStorageFactory = (deps: {
    suiteSyncErrorHandler: SuiteSyncErrorHandler;
}) => CreateSuiteStorage;

type CreateSuiteStorageFactoryDep = {
    createSuiteStorageFactory: CreateSuiteStorageFactory;
};

type CreateSuiteSyncCompositionRootDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: RetrieveSuiteSyncOwnerDeps['trezorConnect'];
} & EnsureDelegatedIdentityKeyDep &
    CreateSuiteStorageFactoryDep &
    CreateSuiteSyncOwnerDep &
    PlatformEncryptionDep &
    SuiteSyncAppReloaderDep;

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

    const getDeviceForStaticSessionId: GetDeviceForStaticSessionId = deviceStaticId =>
        selectDeviceByStaticSessionId(deps.getState(), deviceStaticId) ?? null;

    const refreshSuiteSyncKeys = createRefreshSuiteSync({
        dispatch: deps.dispatch,
        ensureDelegatedIdentityKey: deps.ensureDelegatedIdentityKey,
        ensureSuiteSyncOwner,
        loadSuiteSyncOwnerFromState,
        getDeviceForStaticSessionId,
        hasAllowance: ({ walletDescriptor, deviceId }) =>
            selectHasDeviceAllowance(deps.getState(), deviceId ?? null, walletDescriptor),
    });

    const suiteSyncErrorHandler: SuiteSyncErrorHandler = createSuiteSyncErrorHandler({
        dispatch: deps.dispatch,
    });

    const createSuiteStorage = deps.createSuiteStorageFactory({ suiteSyncErrorHandler });

    const ensureStorage = createEnsureStorage({
        refreshSuiteSyncKeys,
        suiteSyncStorageRepository,
        createSuiteStorage,
        defaultRelayUrl: DEFAULT_SUITE_SYNC_RELAY_URL,
        getRelayUrl: toGetter(deps.getState, selectSuiteSyncRelayUrl),
        getDeviceForStaticSessionId,
    });

    const suiteSyncListener = createSuiteSyncListener({
        dispatch: deps.dispatch,
    });

    const subscribeSuiteSyncData = createEnsureSubscribeSuiteSyncData({
        subscriptionStorage,
        ensureStorage,
        suiteSyncListener,
    });

    const ensureWalletSuiteSyncOn = createEnsureWalletSuiteSyncOnWithErrorHandler({
        dispatch: deps.dispatch,
        ensureWalletSuiteSyncOn: createEnsureWalletSuiteSyncOn({
            getState: deps.getState,
            refreshSuiteSyncKeys,
            ensureSuiteSyncData: subscribeSuiteSyncData,
            subscriptionStorage,
        }),
    });

    const turnOffSuiteSyncForWallet = createTurnOffSuiteSyncForWallet({
        suiteSyncStorageRepository,
        subscriptionStorage,
    });

    const getIsSuiteSyncEnabled = toGetter(deps.getState, selectIsSuiteSyncEnabled);
    const getAllDeviceSessionIds = toGetter(deps.getState, selectAllDeviceStaticIds);

    return {
        changeRelayUrl: createChangeRelayUrl({
            suiteSyncStorageRepository,
            getAllDeviceSessionIds,
            dispatch: deps.dispatch,
        }),
        ensureWalletSuiteSyncOn,
        turnOffSuiteSyncForWallet,
        turnOffSuiteSync: createTurnOffSuiteSync({
            getIsSuiteSyncEnabled,
            getAllDeviceSessionIds,
            dispatch: deps.dispatch,
            turnOffSuiteSyncForWallet,
            reloadApp: deps.reloadApp,
        }),
        turnOnSuiteSync: createTurnOnSuiteSync({
            getIsSuiteSyncEnabled,
            dispatch: deps.dispatch,
            ensureWalletSuiteSyncOn,
        }),
        labeling: {
            updateWalletLabel: createUpdateWalletLabel({ ensureWalletSuiteSyncOn }),
            updateAccountLabel: createUpdateAccountLabel({ ensureWalletSuiteSyncOn }),
            updateOutputLabel: createUpdateOutputLabel({ ensureWalletSuiteSyncOn }),
            updateAddressLabel: createUpdateAddressLabel({ ensureWalletSuiteSyncOn }),
        },
    };
};
