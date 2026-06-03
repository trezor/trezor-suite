import { type Dispatch } from '@reduxjs/toolkit';

import { type AnalyticsSharedEvents } from '@suite-common/analytics';
import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { toGetter } from '@suite-common/dependency-injection';
import {
    selectAllDeviceStaticIds,
    selectDeviceByStaticSessionId,
    selectSelectedDevice,
} from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import {
    type FetchDep,
    type WithSuiteSyncQuotaManagerState,
    createSuiteSyncQuotaManagerCompositionRoot,
} from '@suite-common/suite-sync-quota-manager';
import {
    type CreateSuiteStorageDep,
    type CreateSuiteSyncOwnerDep,
} from '@suite-common/suite-sync-storage';
import {
    type OnWalletSuiteSyncOnEnsured,
    type SuiteSync,
    type SuiteSyncInternalErrorHandler,
    type WalletSuiteSyncOnEnsuredListener,
} from '@suite-common/suite-sync-types';
import { type AccountsRootState, selectAccounts } from '@suite-common/wallet-core';
import { type Analytics } from '@trezor/analytics-uploader';
import type TrezorConnect from '@trezor/connect';

import { createEnsureSuiteSyncKeys } from './createEnsureSuiteSyncKeys';
import { createSuiteSyncInternalErrorHandler } from './createSuiteSyncInternalErrorHandler';
import { createTurnOffSuiteSync } from './createTurnOffSuiteSync';
import { createTurnOnSuiteSync } from './createTurnOnSuiteSync';
import { selectSuiteSyncAccountLabel } from './data/account/selectSuiteSyncAccountLabel';
import { selectSuiteSyncAddressLabel } from './data/address/suiteSyncAddressSelectors';
import { createEnsureSubscribedStorage } from './data/createEnsureSubscribedStorage';
import { createSuiteSyncListener } from './data/createSuiteSyncListener';
import { createDangerouslyWipeAllLabelsFromWallet } from './data/labeling/createDangerouslyWipeAllLabelsFromWallet';
import { createUpdateAccountLabel } from './data/labeling/createUpdateAccountLabel';
import { createUpdateAddressLabel } from './data/labeling/createUpdateAddressLabel';
import { createUpdateOutputLabel } from './data/labeling/createUpdateOutputLabel';
import { createUpdateWalletLabel } from './data/labeling/createUpdateWalletLabel';
import { selectAllLabelsForAccount } from './data/labeling/selectAllLabelsForAccount';
import { selectSuiteSyncOutputLabel } from './data/output/suiteSyncOutputSelectors';
import { type SuiteSyncDataRootState } from './data/suiteSyncDataReducer';
import { selectSuiteSyncWalletLabel } from './data/wallet/suiteSyncWalletSelectors';
import { type GetDeviceForStaticSessionId } from './getDeviceForStaticSessionId';
import { createEnsureSuiteSyncOwner } from './owner/createEnsureSuiteSyncOwner';
import { createLoadSuiteSyncOwnerFromState } from './owner/createLoadSuiteSyncOwnerFromState';
import { createRetrieveSuiteSyncOwner } from './owner/createRetrieveSuiteSyncOwner';
import { createSaveSuiteSyncOwner } from './owner/createSaveSuiteSyncOwner';
import { createChangeRelayUrl } from './relay/createChangeRelayUrl';
import { isUsingTrezorServer } from './relay/isUsingTrezorServer';
import { createEnsureStorage } from './storage/createEnsureStorage';
import { createEnsureWalletSuiteSyncOn } from './storage/createEnsureWalletSuiteSyncOn';
import { createEnsureWalletSuiteSyncOnUncontrolled } from './storage/createEnsureWalletSuiteSyncOnUncontrolled';
import { createEnsureWalletSuiteSyncOnWithErrorHandler } from './storage/createEnsureWalletSuiteSyncOnWithErrorHandler';
import { createSubscriptionStorage } from './storage/createSubscriptionStorage';
import { createSuiteSyncStorageRepository } from './storage/createSuiteSyncStorageRepository';
import { createTurnOffSuiteSyncForWallet } from './storage/createTurnOffSuiteSyncForWallet';
import {
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncOwnerForDeviceStaticId,
    selectSuiteSyncRelayUrl,
} from './suiteSyncSelectors';
import { type SuiteSyncUncontrolledErrorHandlerDep } from './suiteSyncUncontrolledErrorHandler';

export type SuiteSyncAnalytics = Pick<Analytics<AnalyticsSharedEvents>, 'report'>;

export type SuiteSyncAnalyticsDep = {
    analytics?: SuiteSyncAnalytics;
};

type SubscribeSuiteSyncInternalErrorHandler = (errorHandler: SuiteSyncInternalErrorHandler) => void;

export type SubscribeSuiteSyncInternalErrorHandlerDep = {
    subscribeError: SubscribeSuiteSyncInternalErrorHandler;
};

type CreateSuiteSyncCompositionRootDeps = {
    getState: () => WithSuiteSyncAndDeviceState &
        WithSuiteSyncQuotaManagerState &
        MessageSystemRootState &
        AccountsRootState &
        SuiteSyncDataRootState;
    dispatch: Dispatch;
    subscribeError: SubscribeSuiteSyncInternalErrorHandler;
    trezorConnect: Pick<typeof TrezorConnect, 'evoluGetNode' | 'evoluSignRegistrationRequest'>;
} & SuiteSyncAnalyticsDep &
    EnsureDelegatedIdentityKeyDep &
    CreateSuiteStorageDep &
    CreateSuiteSyncOwnerDep &
    PlatformEncryptionDep &
    FetchDep &
    SuiteSyncUncontrolledErrorHandlerDep;

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

    const ensureSuiteSyncKeys = createEnsureSuiteSyncKeys({
        dispatch: deps.dispatch,
        ensureDelegatedIdentityKey: deps.ensureDelegatedIdentityKey,
        ensureSuiteSyncOwner,
        getDeviceForStaticSessionId,
    });

    const { ensureQuota, allocateOwnerQuota, getOwnerHasAllowance } =
        createSuiteSyncQuotaManagerCompositionRoot({
            dispatch: deps.dispatch,
            getState: deps.getState,
            getDeviceForStaticSessionId,
            getIsUsingTrezorRelay: () =>
                isUsingTrezorServer(selectSuiteSyncRelayUrl(deps.getState())),
            trezorConnect: deps.trezorConnect,
            fetch: deps.fetch,
        });

    const suiteSyncInternalErrorHandler = createSuiteSyncInternalErrorHandler({
        getSelectedDevice: toGetter(deps.getState, selectSelectedDevice),
        allocateOwnerQuota,
        ensureDelegatedIdentityKey: deps.ensureDelegatedIdentityKey,
        suiteSyncUncontrolledErrorHandler: deps.suiteSyncUncontrolledErrorHandler,
    });

    deps.subscribeError(suiteSyncInternalErrorHandler);

    const ensureStorage = createEnsureStorage({
        ensureSuiteSyncKeys,
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

    const ensureSubscribedStorage = createEnsureSubscribedStorage({
        subscriptionStorage,
        ensureStorage,
        suiteSyncListener,
    });

    const walletSuiteSyncOnEnsuredListeners: WalletSuiteSyncOnEnsuredListener[] = [];

    const onWalletSuiteSyncOnEnsured: OnWalletSuiteSyncOnEnsured = listener => {
        walletSuiteSyncOnEnsuredListeners.push(listener);
    };

    const ensureWalletSuiteSyncOn = createEnsureWalletSuiteSyncOnWithErrorHandler({
        dispatch: deps.dispatch,
        ensureWalletSuiteSyncOn: createEnsureWalletSuiteSyncOn({
            getState: deps.getState,
            ensureSuiteSyncKeys,
            ensureSubscribedStorage,
            subscriptionStorage,
            getWalletSuiteSyncOnEnsuredListeners: () => walletSuiteSyncOnEnsuredListeners,
        }),
    });

    const ensureWalletSuiteSyncOnUncontrolled = createEnsureWalletSuiteSyncOnUncontrolled({
        ensureWalletSuiteSyncOn,
        getDeviceForStaticSessionId,
        suiteSyncUncontrolledErrorHandler: deps.suiteSyncUncontrolledErrorHandler,
    });

    const turnOffSuiteSyncForWallet = createTurnOffSuiteSyncForWallet({
        suiteSyncStorageRepository,
        subscriptionStorage,
        dispatch: deps.dispatch,
    });

    const getIsSuiteSyncEnabled = toGetter(deps.getState, selectIsSuiteSyncEnabled);
    const getAllDeviceSessionIds = toGetter(deps.getState, selectAllDeviceStaticIds);
    const getAccounts = toGetter(deps.getState, selectAccounts);

    const labelingDeps = {
        ensureWalletSuiteSyncOn,
        analytics: deps.analytics,
        getWalletLabel: toGetter(deps.getState, selectSuiteSyncWalletLabel),
        getAccountLabel: toGetter(deps.getState, selectSuiteSyncAccountLabel),
        getAddressLabel: toGetter(deps.getState, selectSuiteSyncAddressLabel),
        getOutputLabel: toGetter(deps.getState, selectSuiteSyncOutputLabel),
    };

    const updateWalletLabel = createUpdateWalletLabel(labelingDeps);
    const updateAccountLabel = createUpdateAccountLabel(labelingDeps);
    const updateOutputLabel = createUpdateOutputLabel(labelingDeps);
    const updateAddressLabel = createUpdateAddressLabel(labelingDeps);

    return {
        changeRelayUrl: createChangeRelayUrl({
            suiteSyncStorageRepository,
            getAllDeviceSessionIds,
            dispatch: deps.dispatch,
        }),
        onWalletSuiteSyncOnEnsured,
        ensureWalletSuiteSyncOnUncontrolled,
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
            getDeviceForStaticSessionId,
        }),
        dangerouslyWipeAllLabelsFromWallet: createDangerouslyWipeAllLabelsFromWallet({
            getWalletLabel: labelingDeps.getWalletLabel,
            getAccounts,
            getAllLabelsForAccount: toGetter(deps.getState, selectAllLabelsForAccount),
            updateWalletLabel,
            updateAccountLabel,
            updateOutputLabel,
            updateAddressLabel,
        }),
        labeling: {
            updateWalletLabel,
            updateAccountLabel,
            updateOutputLabel,
            updateAddressLabel,
        },
    };
};
