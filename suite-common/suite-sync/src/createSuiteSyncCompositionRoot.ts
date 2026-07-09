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
    type GetIsTorEnabledDep,
    type OnStorageEnsured,
    type OnStorageEnsuredDep,
    type SuiteSync,
    type SuiteSyncInternalErrorHandler,
} from '@suite-common/suite-sync-types';
import { type AccountsRootState, selectAccounts } from '@suite-common/wallet-core';
import { type Analytics } from '@trezor/analytics-uploader';
import type TrezorConnect from '@trezor/connect';

import { createEnsureSuiteSyncKeys } from './createEnsureSuiteSyncKeys';
import { createSuiteSyncInternalErrorHandler } from './createSuiteSyncInternalErrorHandler';
import { createTurnOffSuiteSync } from './createTurnOffSuiteSync';
import { createTurnOnSuiteSync } from './createTurnOnSuiteSync';
import { createEnsureSubscribedStorage } from './data/createEnsureSubscribedStorage';
import { createSuiteSyncListener } from './data/createSuiteSyncListener';
import { createUpdateAccountLabel } from './data/labeling/account/createUpdateAccountLabel';
import { createUpdateAddressLabel } from './data/labeling/address/createUpdateAddressLabel';
import { createDangerouslyWipeAllLabelsFromWallet } from './data/labeling/createDangerouslyWipeAllLabelsFromWallet';
import { createSuiteSyncWriteLabels } from './data/labeling/createSuiteSyncWriteLabels';
import { createUpdateOutputLabel } from './data/labeling/output/createUpdateOutputLabel';
import { selectAllLabelsForAccount } from './data/labeling/selectAllLabelsForAccount';
import { createUpdateWalletLabel } from './data/labeling/wallet/createUpdateWalletLabel';
import { type SuiteSyncDataRootState } from './data/suiteSyncDataReducer';
import { selectSuiteSyncWalletLabel } from './data/wallet/suiteSyncWalletSelectors';
import { type GetDeviceForStaticSessionId } from './getDeviceForStaticSessionId';
import { createEnsureSuiteSyncOwner } from './owner/createEnsureSuiteSyncOwner';
import { createLoadSuiteSyncOwnerFromState } from './owner/createLoadSuiteSyncOwnerFromState';
import { createRetrieveSuiteSyncOwner } from './owner/createRetrieveSuiteSyncOwner';
import { createSaveSuiteSyncOwner } from './owner/createSaveSuiteSyncOwner';
import { createChangeRelayUrl } from './relay/createChangeRelayUrl';
import { createDisconnectAllRelays } from './relay/createDisconnectAllRelays';
import { createReconnectAllRelays } from './relay/createReconnectAllRelays';
import { isUsingTrezorServer } from './relay/isUsingTrezorServer';
import { selectSuiteSyncRelayUrl } from './relay/relayUrl';
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
} from './suiteSyncSelectors';
import { type SuiteSyncUncontrolledErrorHandlerDep } from './suiteSyncUncontrolledErrorHandler';

export type SuiteSyncAnalytics = Pick<Analytics<AnalyticsSharedEvents>, 'report'>;

export type SuiteSyncAnalyticsDep = {
    analytics?: SuiteSyncAnalytics;
};

type SubscribeSuiteSyncInternalErrorHandler = (errorHandler: SuiteSyncInternalErrorHandler) => void;

type CreateSuiteSyncCompositionRootDeps = {
    getState: () => WithSuiteSyncAndDeviceState &
        WithSuiteSyncQuotaManagerState &
        MessageSystemRootState &
        AccountsRootState &
        SuiteSyncDataRootState;
    dispatch: Dispatch;
    subscribeError: SubscribeSuiteSyncInternalErrorHandler;
    trezorConnect: Pick<typeof TrezorConnect, 'evoluGetNode' | 'evoluSignRegistrationRequest'>;
} & OnStorageEnsuredDep &
    SuiteSyncAnalyticsDep &
    EnsureDelegatedIdentityKeyDep &
    CreateSuiteStorageDep &
    CreateSuiteSyncOwnerDep &
    PlatformEncryptionDep &
    FetchDep &
    SuiteSyncUncontrolledErrorHandlerDep &
    GetIsTorEnabledDep;

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

    const getRelayUrl = () => selectSuiteSyncRelayUrl(deps.getState(), deps.getIsTorEnabled());

    const { ensureQuota, allocateOwnerQuota, getOwnerHasAllowance } =
        createSuiteSyncQuotaManagerCompositionRoot({
            dispatch: deps.dispatch,
            getState: deps.getState,
            getDeviceForStaticSessionId,
            getIsUsingTrezorRelay: () => isUsingTrezorServer(getRelayUrl()),
            getIsTorEnabled: deps.getIsTorEnabled,
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
        getRelayUrl,
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

    const onStorageEnsured: OnStorageEnsured = deps.onStorageEnsured ?? (() => {});

    const ensureWalletSuiteSyncOn = createEnsureWalletSuiteSyncOnWithErrorHandler({
        dispatch: deps.dispatch,
        ensureWalletSuiteSyncOn: createEnsureWalletSuiteSyncOn({
            getState: deps.getState,
            ensureSuiteSyncKeys,
            ensureSubscribedStorage,
            subscriptionStorage,
            onStorageEnsured,
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

    const writeLabels = createSuiteSyncWriteLabels({
        getState: deps.getState,
        analytics: deps.analytics,
    });

    const updateWalletLabel = createUpdateWalletLabel({
        ensureWalletSuiteSyncOn,
        writeWalletLabel: writeLabels.writeWalletLabel,
    });
    const updateAccountLabel = createUpdateAccountLabel({
        ensureWalletSuiteSyncOn,
        writeAccountLabel: writeLabels.writeAccountLabel,
    });
    const updateOutputLabel = createUpdateOutputLabel({
        ensureWalletSuiteSyncOn,
        writeOutputLabel: writeLabels.writeOutputLabel,
    });
    const updateAddressLabel = createUpdateAddressLabel({
        ensureWalletSuiteSyncOn,
        writeAddressLabel: writeLabels.writeAddressLabel,
    });

    const disconnectAllRelays = createDisconnectAllRelays({
        suiteSyncStorageRepository,
        getAllDeviceSessionIds,
    });
    const reconnectAllRelays = createReconnectAllRelays({
        suiteSyncStorageRepository,
        getAllDeviceSessionIds,
        getState: deps.getState,
    });

    return {
        changeRelayUrl: createChangeRelayUrl({
            dispatch: deps.dispatch,
            getIsTorEnabled: deps.getIsTorEnabled,
            reconnectAllRelays,
        }),
        disconnectAllRelays,
        reconnectAllRelays,
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
            getWalletLabel: toGetter(deps.getState, selectSuiteSyncWalletLabel),
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
