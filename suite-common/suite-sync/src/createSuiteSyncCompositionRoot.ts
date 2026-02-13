import { type Dispatch } from '@reduxjs/toolkit';

import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { toGetter } from '@suite-common/dependency-injection';
import { selectAllDeviceStaticIds, selectDeviceByStaticSessionId } from '@suite-common/device';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { createSuiteSyncQuotaManagerCompositionRoot } from '@suite-common/suite-sync-quota-manager';
import {
    type CreateSuiteStorageDep,
    type CreateSuiteSyncOwnerDep,
} from '@suite-common/suite-sync-storage';
import { type SuiteSync } from '@suite-common/suite-sync-types';
import { type Analytics } from '@trezor/analytics-uploader';

import { createRefreshSuiteSync } from './createRefreshSuiteSyncKeys';
import { createTurnOffSuiteSync } from './createTurnOffSuiteSync';
import { createTurnOnSuiteSync } from './createTurnOnSuiteSync';
import { selectSuiteSyncAccountLabel } from './data/account/selectSuiteSyncAccountLabel';
import { selectSuiteSyncAddressLabel } from './data/address/suiteSyncAddressSelectors';
import { createEnsureSubscribeSuiteSyncData } from './data/createEnsureSubscribeSuiteSyncData';
import { createSuiteSyncListener } from './data/createSuiteSyncListener';
import { createUpdateAccountLabel } from './data/labeling/createUpdateAccountLabel';
import { createUpdateAddressLabel } from './data/labeling/createUpdateAddressLabel';
import { createUpdateOutputLabel } from './data/labeling/createUpdateOutputLabel';
import { createUpdateWalletLabel } from './data/labeling/createUpdateWalletLabel';
import { selectSuiteSyncOutputLabel } from './data/output/suiteSyncOutputSelectors';
import { selectSuiteSyncWalletLabel } from './data/wallet/suiteSyncWalletSelectors';
import { type GetDeviceForStaticSessionId } from './getDeviceForStaticSessionId';
import { createEnsureSuiteSyncOwner } from './owner/createEnsureSuiteSyncOwner';
import { createLoadSuiteSyncOwnerFromState } from './owner/createLoadSuiteSyncOwnerFromState';
import {
    type RetrieveSuiteSyncOwnerDeps,
    createRetrieveSuiteSyncOwner,
} from './owner/createRetrieveSuiteSyncOwner';
import { createSaveSuiteSyncOwner } from './owner/createSaveSuiteSyncOwner';
import { createChangeRelayUrl } from './relay/createChangeRelayUrl';
import { isUsingTrezorServer } from './relay/isUsingTrezorServer';
import { createEnsureStorage } from './storage/createEnsureStorage';
import { createEnsureWalletSuiteSyncOn } from './storage/createEnsureWalletSuiteSyncOn';
import { createEnsureWalletSuiteSyncOnWithErrorHandler } from './storage/createEnsureWalletSuiteSyncOnWithErrorHandler';
import { createSubscriptionStorage } from './storage/createSubscriptionStorage';
import { createSuiteSyncStorageRepository } from './storage/createSuiteSyncStorageRepository';
import { createTurnOffSuiteSyncForWallet } from './storage/createTurnOffSuiteSyncForWallet';
import {
    selectIsSuiteSyncEnabled,
    selectSuiteSyncOwnerForDeviceStaticId,
    selectSuiteSyncRelayUrl,
} from './suiteSyncSelectors';

export type SuiteSyncAnalytics = Pick<Analytics<AnalyticsSharedEvents>, 'report'>;

export type SuiteSyncAnalyticsDep = {
    analytics?: SuiteSyncAnalytics;
};

type CreateSuiteSyncCompositionRootDeps = {
    getState: () => any;
    dispatch: Dispatch;
    trezorConnect: RetrieveSuiteSyncOwnerDeps['trezorConnect'];
} & SuiteSyncAnalyticsDep &
    EnsureDelegatedIdentityKeyDep &
    CreateSuiteStorageDep &
    CreateSuiteSyncOwnerDep &
    PlatformEncryptionDep;

export const createSuiteSyncCompositionRoot = (
    deps: CreateSuiteSyncCompositionRootDeps,
): SuiteSync => {
    const suiteSyncStorageRepository = createSuiteSyncStorageRepository();

    const subscriptionStorage = createSubscriptionStorage();

    const loadSuiteSyncOwnerFromState = createLoadSuiteSyncOwnerFromState({
        dispatch: deps.dispatch,
        platformEncryption: deps.platformEncryption,
        getDeviceSuiteSyncOwner: toGetter(deps.getState, selectSuiteSyncOwnerForDeviceStaticId),
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
        getDeviceForStaticSessionId,
    });

    const { ensureQuota, getOwnerHasAllowance } = createSuiteSyncQuotaManagerCompositionRoot({
        dispatch: deps.dispatch,
        getState: deps.getState,
        getDeviceForStaticSessionId,
        getIsUsingTrezorRelay: () => isUsingTrezorServer(selectSuiteSyncRelayUrl(deps.getState())),
    });

    const ensureStorage = createEnsureStorage({
        refreshSuiteSyncKeys,
        ensureQuota,
        suiteSyncStorageRepository,
        createSuiteStorage: deps.createSuiteStorage,
        getRelayUrl: toGetter(deps.getState, selectSuiteSyncRelayUrl),
        getDeviceForStaticSessionId,
        getOwnerHasAllowance,
    });

    const suiteSyncListener = createSuiteSyncListener({
        dispatch: deps.dispatch,
    });

    const ensureSubscribeSuiteSyncData = createEnsureSubscribeSuiteSyncData({
        subscriptionStorage,
        ensureStorage,
        suiteSyncListener,
    });

    const ensureWalletSuiteSyncOn = createEnsureWalletSuiteSyncOnWithErrorHandler({
        dispatch: deps.dispatch,
        ensureWalletSuiteSyncOn: createEnsureWalletSuiteSyncOn({
            getState: deps.getState,
            refreshSuiteSyncKeys,
            ensureSubscribeSuiteSyncData,
            subscriptionStorage,
        }),
    });

    const turnOffSuiteSyncForWallet = createTurnOffSuiteSyncForWallet({
        suiteSyncStorageRepository,
        subscriptionStorage,
    });

    const getIsSuiteSyncEnabled = toGetter(deps.getState, selectIsSuiteSyncEnabled);
    const getAllDeviceSessionIds = toGetter(deps.getState, selectAllDeviceStaticIds);

    const labelingDeps = {
        ensureWalletSuiteSyncOn,
        analytics: deps.analytics,
        getWalletLabel: toGetter(deps.getState, selectSuiteSyncWalletLabel),
        getAccountLabel: toGetter(deps.getState, selectSuiteSyncAccountLabel),
        getAddressLabel: toGetter(deps.getState, selectSuiteSyncAddressLabel),
        getOutputLabel: toGetter(deps.getState, selectSuiteSyncOutputLabel),
    };

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
        }),
        turnOnSuiteSync: createTurnOnSuiteSync({
            getIsSuiteSyncEnabled,
            dispatch: deps.dispatch,
            ensureWalletSuiteSyncOn,
        }),
        labeling: {
            updateWalletLabel: createUpdateWalletLabel(labelingDeps),
            updateAccountLabel: createUpdateAccountLabel(labelingDeps),
            updateOutputLabel: createUpdateOutputLabel(labelingDeps),
            updateAddressLabel: createUpdateAddressLabel(labelingDeps),
        },
    };
};
