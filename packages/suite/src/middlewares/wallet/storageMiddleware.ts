import { type UnknownAction, isAnyOf } from '@reduxjs/toolkit';
import { type MiddlewareAPI, type Dispatch as ReduxDispatch } from 'redux';

import {
    clientOnPrisonEvent,
    isCoinjoinAccountPersistenceAction,
    setDebugSettings,
} from '@suite/coinjoin';
import { debugActions } from '@suite/debug';
import { featureUsed, feedbackDismissed, feedbackRequested } from '@suite/feature-feedback';
import {
    type FlagsRootState,
    markNewContentIndicatorAsSeen,
    setFlag,
    setNewContentIndicatorSeen,
} from '@suite/flags';
import { metadataActions } from '@suite/metadata';
import { type SuiteSettingsRootState, suiteSettingsActions } from '@suite/settings';
import { dismissUnsupportedDeviceBanner } from '@suite/suite-sync';
import { analyticsActions } from '@suite-common/analytics-redux';
import { bluetoothActions } from '@suite-common/bluetooth';
import { connectPopupActions } from '@suite-common/connect-popup';
import {
    type DeviceRootState,
    deviceActions,
    selectDeviceByState,
    selectDeviceByStaticSessionId,
    selectDevices,
    selectSelectedDevice,
} from '@suite-common/device';
import { discreetModeActions } from '@suite-common/discreet-mode';
import { firmwareActions } from '@suite-common/firmware';
import { messageSystemActions } from '@suite-common/message-system';
import { type NetworkConfigDeps } from '@suite-common/networks';
import { receiveActions } from '@suite-common/receive';
import { type ActionFromMatcher, type Dispatch, type TypeGuard } from '@suite-common/redux-utils';
import {
    setSuiteSyncOwner,
    setSuiteSyncRelayUrl,
    updateSuiteSyncDebugEnabled,
    updateSuiteSyncEnabled,
} from '@suite-common/suite-sync';
import { suiteSyncQuotaManagerActions } from '@suite-common/suite-sync-quota-manager';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getIsDeviceRemembered } from '@suite-common/suite-utils';
import { thpActions } from '@suite-common/thp';
import { TokenManagementAction } from '@suite-common/token-definitions';
import { tokenDefinitionsActions } from '@suite-common/token-definitions/src/tokenDefinitionsActions';
import { tradingActions } from '@suite-common/trading';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    accountsActions,
    blockchainActions,
    changeNetworks,
    earnOnboardingActions,
    explorerActions,
    phishingActions,
    selectAccountByKey,
    selectAccountsByDeviceState,
    selectHistoricFiatRates,
    selectIsDeviceAutoEjectEnabled,
    setAddressDisplayType,
    setAutoEjectEnabled,
    setBaseCurrency,
    setBitcoinAmountUnits,
    setMevProtection,
    setNetworkReserve,
    setSuspiciousTransactionsFilter,
    transactionsActions,
    updateTxsFiatRatesThunk,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { findAccountDevice, isAccountSuccessful } from '@suite-common/wallet-utils';
import { walletConnectActions } from '@suite-common/walletconnect';
import { DEVICE, isDeviceEventOfType } from '@trezor/connect';

import * as storageActions from 'src/actions/suite/storageActions';
import { storageError } from 'src/actions/suite/storageLifecycleActions';
import {
    closeEvmExplanationBanner,
    confirmEvmExplanationModal,
} from 'src/actions/suite/suiteActions';
import { accountGraphFail, accountGraphSuccess } from 'src/actions/wallet/graphActions';
import { type SuiteState } from 'src/reducers/suite/suiteReducer';
import { selectGraph } from 'src/reducers/wallet/graphReducer';
import { type GraphState } from 'src/reducers/wallet/graphReducer';
import { getSuiteDB } from 'src/storage';

type StorageMiddlewareState = AccountsRootState &
    DeviceRootState &
    FiatRatesRootState &
    WalletSettingsRootState &
    FlagsRootState &
    SuiteSettingsRootState & {
        suite: Pick<SuiteState, 'evmSettings' | 'seenDisconnectNotificationForDeviceIds'>;
        wallet: {
            graph: GraphState;
        };
    };

const getDeviceByAccountKey = (accountKey: AccountKey, state: StorageMiddlewareState) => {
    const account = selectAccountByKey(state, accountKey);

    return account ? findAccountDevice(account, selectDevices(state)) : undefined;
};

type RememberedDeviceSaveParams<TAction> = {
    action: TAction;
    device: TrezorDevice;
};

type RememberedDeviceSaveDeps = {
    dispatch: Dispatch;
    getState: () => StorageMiddlewareState;
};

type RememberedDeviceHandler = {
    match: ReadonlyArray<(action: UnknownAction) => boolean>;
    getDevice: (action: any, state: StorageMiddlewareState) => TrezorDevice | undefined;
    save: (params: RememberedDeviceSaveParams<any>, deps: RememberedDeviceSaveDeps) => void;
};

const defineRememberedDeviceHandler = <Matchers extends ReadonlyArray<TypeGuard<any>>>(handler: {
    match: readonly [...Matchers];
    getDevice: (
        action: ActionFromMatcher<Matchers[number]>,
        state: StorageMiddlewareState,
    ) => TrezorDevice | undefined;
    save: (
        params: RememberedDeviceSaveParams<ActionFromMatcher<Matchers[number]>>,
        deps: RememberedDeviceSaveDeps,
    ) => void;
}): RememberedDeviceHandler => handler;

// Device-scoped data must be persisted only for remembered devices. Do not check
// getIsDeviceRemembered by hand — register a handler here and the loop in the middleware below
// applies the check based on the declared getDevice.
const rememberedDeviceHandlers = (
    networkConfigDeps: NetworkConfigDeps,
): RememberedDeviceHandler[] => [
    defineRememberedDeviceHandler({
        match: [
            accountsActions.createAccount.match,
            accountsActions.changeAccountVisibility.match,
            accountsActions.updateAccount.match,
        ],
        getDevice: (action, state) =>
            findAccountDevice(action.payload.account, selectDevices(state)),
        save: ({ action }, { dispatch, getState }) => {
            const account = selectAccountByKey(getState(), action.payload.account.key);
            if (!account) return;

            if (!isAccountSuccessful(account)) {
                return;
            }

            storageActions.saveAccounts(networkConfigDeps, [account]);
            dispatch(storageActions.saveCoinjoinAccountThunk(networkConfigDeps, account.key));
        },
    }),
    defineRememberedDeviceHandler({
        // When setDeviceState/addAuthorizedDevice is dispatched for passphrase wallet, it means
        // that its device was just created, but already discovered accounts may have not been
        // persisted, so try to do it now.
        match: [deviceActions.setDeviceState.match, deviceActions.addAuthorizedDevice.match],
        getDevice: (action, state) => selectDeviceByState(state, action.payload.state),
        save: ({ action, device }, { getState }) => {
            if (device.useEmptyPassphrase) {
                return;
            }

            const accounts = selectAccountsByDeviceState(getState(), action.payload.state).filter(
                isAccountSuccessful,
            );

            storageActions.saveAccounts(networkConfigDeps, accounts);
        },
    }),
    defineRememberedDeviceHandler({
        // If there is a change in account.metadata (metadataActions.setAccountLoaded), update database.
        match: [metadataActions.setAccountAdd.match],
        getDevice: (action, state) => findAccountDevice(action.payload, selectDevices(state)),
        save: ({ action }) => {
            if (!isAccountSuccessful(action.payload)) {
                return;
            }

            storageActions.saveAccounts(networkConfigDeps, [action.payload]);
        },
    }),
    defineRememberedDeviceHandler({
        match: [
            receiveActions.showAddress.match,
            receiveActions.touchAddress.match,
            receiveActions.setCurrentFreshAddress.match,
        ],
        getDevice: (action, state) => getDeviceByAccountKey(action.payload.accountKey, state),
        save: ({ action }, { dispatch }) => {
            dispatch(
                storageActions.saveAccountReceiveThunk(
                    networkConfigDeps,
                    action.payload.accountKey,
                ),
            );
        },
    }),
    defineRememberedDeviceHandler({
        match: [earnOnboardingActions.confirmEarnOnboarding.match],
        getDevice: (action, state) => getDeviceByAccountKey(action.payload.accountKey, state),
        save: ({ action }, { dispatch }) => {
            dispatch(
                storageActions.saveEarnOnboardingThunk(
                    networkConfigDeps,
                    action.payload.accountKey,
                ),
            );
        },
    }),
    defineRememberedDeviceHandler({
        match: [
            transactionsActions.addTransaction.match,
            transactionsActions.removeTransaction.match,
        ],
        getDevice: (action, state) =>
            findAccountDevice(action.payload.account, selectDevices(state)),
        save: ({ action }, { dispatch }) => {
            const { account } = action.payload;

            storageActions.removeAccountTransactions(networkConfigDeps, account);
            dispatch(storageActions.saveAccountTransactionsThunk(networkConfigDeps, account));
        },
    }),
    defineRememberedDeviceHandler({
        match: [transactionsActions.markTransactionAsNotScam.match],
        getDevice: (action, state) => getDeviceByAccountKey(action.payload.key, state),
        save: ({ action }, { dispatch, getState }) => {
            const account = selectAccountByKey(getState(), action.payload.key);

            if (account) {
                dispatch(storageActions.saveAccountTransactionsThunk(networkConfigDeps, account));
            }
        },
    }),
    defineRememberedDeviceHandler({
        match: [
            transactionsActions.removeTransaction.match,
            updateTxsFiatRatesThunk.fulfilled.match,
        ],
        getDevice: (action, state) => {
            const { account } = action.payload;

            return account ? getDeviceByAccountKey(account.key, state) : undefined;
        },
        save: ({ action }, { dispatch, getState }) => {
            const { account } = action.payload;

            if (!account) {
                return;
            }

            storageActions.removeAccountHistoricRates(networkConfigDeps, account.key);

            const historicRates = selectHistoricFiatRates(getState());
            if (historicRates) {
                dispatch(
                    storageActions.saveAccountHistoricRatesThunk(
                        networkConfigDeps,
                        account.key,
                        historicRates,
                    ),
                );
            }
        },
    }),
    defineRememberedDeviceHandler({
        match: [deviceActions.updateSelectedDevice.match],
        getDevice: action => action.payload,
        save: ({ device }, { getState }) => {
            const isAutoEjectEnabled = selectIsDeviceAutoEjectEnabled(getState());

            if (device.mode !== 'normal' || isAutoEjectEnabled) {
                return;
            }

            (storageActions.saveAccounts(networkConfigDeps, []) ?? Promise.resolve())
                // This is a bit strange workaround to ensure that device data will be stored after all account-related db transactions are settled,
                // in order not to persist successful discovery before persisting all its accounts
                .then(() => storageActions.saveDevice(networkConfigDeps, device));
        },
    }),
    defineRememberedDeviceHandler({
        match: [suiteSettingsActions.setCoinjoinReceiveWarningHidden.match],
        getDevice: (_action, state) => selectSelectedDevice(state),
        save: (_params, { dispatch }) => {
            dispatch(storageActions.saveSuiteSettingsThunk(networkConfigDeps));
        },
    }),
    defineRememberedDeviceHandler({
        match: [accountGraphSuccess.match, accountGraphFail.match],
        getDevice: (action, state) =>
            selectDevices(state).find(
                device => device.state?.staticSessionId === action.payload.account.deviceState,
            ),
        save: ({ action }, { getState }) => {
            const { account } = action.payload;
            const graphEntry = selectGraph(getState()).data.find(
                d =>
                    d.account.deviceState === account.deviceState &&
                    d.account.descriptor === account.descriptor &&
                    d.account.symbol === account.symbol,
            );
            if (graphEntry) {
                storageActions.saveGraph(networkConfigDeps, [graphEntry]);
            }
        },
    }),
    defineRememberedDeviceHandler({
        match: [metadataActions.setErrorForDevice.match],
        getDevice: (action, state) =>
            selectDeviceByStaticSessionId(state, action.payload.deviceState),
        save: ({ device }, { dispatch }) => {
            dispatch(storageActions.saveDeviceMetadataErrorThunk(networkConfigDeps, device));
        },
    }),
    defineRememberedDeviceHandler({
        // Au, this hurts, I need to call saveDevice manually. Saved device should be updated
        // automatically anytime any of its properties change.
        match: [metadataActions.setDeviceMetadata.match],
        getDevice: (action, state) =>
            selectDeviceByStaticSessionId(state, action.payload.deviceState),
        save: ({ action, device }) => {
            storageActions.saveDevice(networkConfigDeps, {
                ...device,
                metadata: action.payload.metadata,
            });
        },
    }),
    defineRememberedDeviceHandler({
        match: [isCoinjoinAccountPersistenceAction],
        getDevice: (action, state) =>
            getDeviceByAccountKey(action.payload.accountKey as AccountKey, state),
        save: ({ action }, { dispatch }) => {
            dispatch(
                storageActions.saveCoinjoinAccountThunk(
                    networkConfigDeps,
                    action.payload.accountKey as AccountKey,
                ),
            );
        },
    }),
];

export const storageMiddleware = (
    networkConfigDeps: NetworkConfigDeps,
    api: MiddlewareAPI<Dispatch, StorageMiddlewareState>,
) => {
    getSuiteDB(networkConfigDeps).onBlocking = () => api.dispatch(storageError('blocking'));
    getSuiteDB(networkConfigDeps).onBlocked = () => api.dispatch(storageError('blocked'));

    return (next: ReduxDispatch<UnknownAction>) =>
        (action: UnknownAction): UnknownAction => {
            // pass action
            next(action);

            // IMPORTANT: The single place enforcing that device-scoped data is persisted only for
            //            remembered devices (see rememberedDeviceHandlers above).
            rememberedDeviceHandlers(networkConfigDeps).forEach(({ match, getDevice, save }) => {
                if (!match.some(matcher => matcher(action))) {
                    return;
                }

                const device = getDevice(action, api.getState());

                if (device && getIsDeviceRemembered(device)) {
                    save({ action, device }, { dispatch: api.dispatch, getState: api.getState });
                }
            });

            if (accountsActions.removeAccount.match(action)) {
                action.payload.forEach(
                    storageActions.removeAccountWithDependencies(networkConfigDeps, api.getState),
                );
            }

            if (changeNetworks.match(action)) {
                api.dispatch(storageActions.saveWalletSettingsThunk(networkConfigDeps));
            }

            if (transactionsActions.resetTransaction.match(action)) {
                const { account } = action.payload;

                storageActions.removeAccountTransactions(networkConfigDeps, account);
                storageActions.removeAccountHistoricRates(networkConfigDeps, account.key);
                storageActions.removeAccountPhishing(networkConfigDeps, account.key);
            }

            if (phishingActions.setDustPhishing.match(action)) {
                api.dispatch(
                    storageActions.savePhishingMetadataThunk(networkConfigDeps, {
                        dustPhishing: action.payload,
                    }),
                );
            }

            if (blockchainActions.setBackend.match(action)) {
                api.dispatch(
                    storageActions.saveBackendThunk(networkConfigDeps, action.payload.symbol),
                );
            }

            if (blockchainActions.setBackendGapLimit.match(action)) {
                api.dispatch(
                    storageActions.saveBackendThunk(networkConfigDeps, action.payload.symbol),
                );
            }

            if (explorerActions.setExplorer.match(action)) {
                storageActions.saveExplorer(networkConfigDeps, action.payload);
            }

            if (
                isAnyOf(
                    messageSystemActions.fetchSuccessUpdate,
                    messageSystemActions.dismissMessage,
                    messageSystemActions.setConfigSource,
                )(action)
            ) {
                api.dispatch(storageActions.saveMessageSystemThunk(networkConfigDeps));
            }

            if (
                isAnyOf(
                    analyticsActions.initAnalytics,
                    analyticsActions.enableAnalytics,
                    analyticsActions.disableAnalytics,
                    analyticsActions.setCustomAnalyticsUrl,
                    analyticsActions.setLoggerEnabled,
                )(action)
            ) {
                api.dispatch(storageActions.saveAnalyticsThunk(networkConfigDeps));
            }

            if (
                isAnyOf(
                    updateSuiteSyncDebugEnabled,
                    updateSuiteSyncEnabled,
                    dismissUnsupportedDeviceBanner,
                    setSuiteSyncRelayUrl,
                )(action)
            ) {
                api.dispatch(storageActions.saveSuiteSyncSettingsThunk(networkConfigDeps));
            }

            if (setSuiteSyncOwner.match(action)) {
                api.dispatch(storageActions.saveSuiteSyncOwner(networkConfigDeps, action.payload));
            }

            if (
                isAnyOf(
                    suiteSyncQuotaManagerActions.quotaManagerDeviceFetched,
                    suiteSyncQuotaManagerActions.updateQuotaManagerBaseUrl,
                    suiteSyncQuotaManagerActions.enforceQuotaManagerUpdated,
                    suiteSyncQuotaManagerActions.eraseFetchedData,
                )(action)
            ) {
                api.dispatch(storageActions.saveSuiteSyncQuotaManagerThunk(networkConfigDeps));
            }

            if (deviceActions.setRememberDevice.match(action)) {
                const isAutoEjectEnabled = selectIsDeviceAutoEjectEnabled(api.getState());

                if (action.payload.remember && !isAutoEjectEnabled) {
                    api.dispatch(
                        storageActions.rememberDeviceThunk(
                            networkConfigDeps,
                            action.payload.device,
                        ),
                    );
                } else {
                    api.dispatch(
                        storageActions.forgetDeviceThunk(networkConfigDeps, action.payload.device),
                    );
                }
            }

            if (deviceActions.forgetDevice.match(action)) {
                api.dispatch(
                    storageActions.forgetDeviceThunk(networkConfigDeps, action.payload.device),
                );
            }

            if (tokenDefinitionsActions.setTokenStatus.match(action)) {
                api.dispatch(
                    storageActions.saveTokenManagementThunk(
                        networkConfigDeps,
                        action.payload.symbol,
                        action.payload.type,
                        TokenManagementAction.HIDE,
                    ),
                );
                api.dispatch(
                    storageActions.saveTokenManagementThunk(
                        networkConfigDeps,
                        action.payload.symbol,
                        action.payload.type,
                        TokenManagementAction.SHOW,
                    ),
                );
            }

            if (
                isAnyOf(
                    deviceActions.connectDevice, // Known device is stored
                    deviceActions.connectUnacquiredDevice, // Known device is stored
                    bluetoothActions.knownDevicesUpdateAction,
                    bluetoothActions.removeKnownDeviceAction,
                    bluetoothActions.deviceUpdateAction, // Known devices may be updated
                )(action)
            ) {
                api.dispatch(storageActions.saveKnownDevicesThunk());
            }

            if (
                isAnyOf(
                    connectPopupActions.rememberAppPermissions,
                    connectPopupActions.forgetAppPermissions,
                    connectPopupActions.forgetAppPermission,
                    connectPopupActions.setAppSilentMode,
                    walletConnectActions.saveSession,
                    walletConnectActions.removeSession,
                )(action)
            ) {
                api.dispatch(storageActions.saveConnectSettingsThunk(networkConfigDeps));
            }

            if (firmwareActions.setFirmwareChannel.match(action)) {
                api.dispatch(storageActions.saveFirmwareSettingsThunk(networkConfigDeps));
            }

            if (isAnyOf(featureUsed, feedbackRequested, feedbackDismissed)(action)) {
                api.dispatch(storageActions.saveFeatureFeedbackThunk(networkConfigDeps));
            }

            if (
                thpActions.removeCredentials.match(action) ||
                isDeviceEventOfType(action, DEVICE.THP_CREDENTIALS_CHANGED) ||
                (isDeviceEventOfType(action, DEVICE.THP_PAIRING_STATUS_CHANGED) &&
                    action.payload.status === 'finished')
            ) {
                api.dispatch(storageActions.saveThpCredentialsThunk());
            }

            if (
                isAnyOf(
                    deviceActions.connectDevice,
                    deviceActions.deviceChanged,
                    deviceActions.setEntropyCheckResult,
                    deviceActions.setDeviceAuthenticityResult,
                    deviceActions.setManualDeviceCheckSuccess,
                    deviceActions.clearDevicePersistentData,
                    deviceActions.forgetDevicePersistentData,
                )(action)
            ) {
                api.dispatch(storageActions.savePersistentDeviceDataThunk(networkConfigDeps));
            }

            if (discreetModeActions.setDiscreetMode.match(action)) {
                api.dispatch(storageActions.saveDiscreetModeThunk(networkConfigDeps));
            }

            if (
                isAnyOf(
                    setBaseCurrency,
                    setBitcoinAmountUnits,
                    setMevProtection,
                    setNetworkReserve,
                    setAutoEjectEnabled,
                    setAddressDisplayType,
                    setSuspiciousTransactionsFilter,
                )(action)
            ) {
                api.dispatch(storageActions.saveWalletSettingsThunk(networkConfigDeps));
            } else if (
                isAnyOf(
                    suiteSettingsActions.setLanguage,
                    setFlag,
                    markNewContentIndicatorAsSeen,
                    setNewContentIndicatorSeen,
                    suiteSettingsActions.setDebugMode,
                    suiteSettingsActions.setExperimentalFeatures,
                    suiteSettingsActions.setOnionLinks,
                    suiteSettingsActions.setTheme,
                    suiteSettingsActions.setAutodetect,
                    suiteSettingsActions.setSidebarWidth,
                    suiteSettingsActions.toggleDeviceAuthenticityCheck,
                    suiteSettingsActions.toggleFirmwareRevisionCheck,
                    suiteSettingsActions.toggleFirmwareHashCheck,
                    suiteSettingsActions.toggleDeviceMetaChecks,
                    suiteSettingsActions.setIsCoinsFilterVisible,
                    closeEvmExplanationBanner,
                    confirmEvmExplanationModal,
                )(action)
            ) {
                api.dispatch(storageActions.saveSuiteSettingsThunk(networkConfigDeps));
            } else if (debugActions.setShowDebugMenu.match(action)) {
                api.dispatch(storageActions.saveDebugSettingsThunk(networkConfigDeps));
            } else if (tradingActions.saveTrade.match(action)) {
                storageActions.saveTradingTrade(networkConfigDeps, action.payload);
            } else if (
                metadataActions.enableMetadata.match(action) ||
                metadataActions.disableMetadata.match(action) ||
                metadataActions.addMetadataProvider.match(action) ||
                metadataActions.removeMetadataProvider.match(action)
            ) {
                api.dispatch(storageActions.saveMetadataSettingsThunk(networkConfigDeps));
            } else if (setDebugSettings.match(action)) {
                api.dispatch(storageActions.saveCoinjoinDebugSettingsThunk(networkConfigDeps));
            } else if (clientOnPrisonEvent.match(action)) {
                // Not a rememberedDeviceHandlers entry: unlike those handlers (one action ->
                // one device), this one action affects multiple accounts on potentially
                // different devices, so the remembered-device check must be applied per account.
                const affectedAccounts = action.payload.map(
                    inmate => inmate.accountKey as AccountKey,
                );
                const state = api.getState();
                affectedAccounts.forEach(key => {
                    const device = getDeviceByAccountKey(key, state);
                    if (device && getIsDeviceRemembered(device)) {
                        api.dispatch(
                            storageActions.saveCoinjoinAccountThunk(networkConfigDeps, key),
                        );
                    }
                });
            }

            return action;
        };
};
