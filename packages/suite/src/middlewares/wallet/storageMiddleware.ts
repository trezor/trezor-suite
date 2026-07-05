import { isAnyOf } from '@reduxjs/toolkit';
import { type MiddlewareAPI } from 'redux';

import { COINJOIN } from '@suite/coinjoin';
import { debugActions } from '@suite/debug';
import { featureUsed, feedbackDismissed, feedbackRequested } from '@suite/feature-feedback';
import { markNewContentIndicatorAsSeen, setFlag, setNewContentIndicatorSeen } from '@suite/flags';
import { METADATA, metadataActions } from '@suite/metadata';
import { suiteSettingsActions } from '@suite/settings';
import { dismissUnsupportedDeviceBanner } from '@suite/suite-sync';
import { analyticsActions } from '@suite-common/analytics-redux';
import { bluetoothActions } from '@suite-common/bluetooth';
import { connectPopupActions } from '@suite-common/connect-popup';
import {
    deviceActions,
    selectDeviceByState,
    selectDeviceByStaticSessionId,
    selectDevices,
    selectSelectedDevice,
} from '@suite-common/device';
import { discreetModeActions } from '@suite-common/discreet-mode';
import { firmwareActions } from '@suite-common/firmware';
import { messageSystemActions } from '@suite-common/message-system';
import { receiveActions } from '@suite-common/receive';
import { type ActionFromMatcher, createLegacyActionTypeMatcher } from '@suite-common/redux-utils';
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
    WALLET_SETTINGS,
    accountsActions,
    blockchainActions,
    changeNetworks,
    explorerActions,
    phishingActions,
    selectAccountByKey,
    selectAccountsByDeviceState,
    selectHistoricFiatRates,
    selectIsDeviceAutoEjectEnabled,
    setBaseCurrency,
    transactionsActions,
    updateTxsFiatRatesThunk,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { findAccountDevice, isAccountSuccessful } from '@suite-common/wallet-utils';
import { walletConnectActions } from '@suite-common/walletconnect';

import { STORAGE, SUITE } from 'src/actions/suite/constants';
import * as storageActions from 'src/actions/suite/storageActions';
import { GRAPH } from 'src/actions/wallet/constants';
import { db } from 'src/storage';
import type { AppState, Dispatch, GetState, Action as SuiteAction } from 'src/types/suite';
import type { WalletAction } from 'src/types/wallet';

type StorageAction = SuiteAction | WalletAction;

const matchLegacyActionType = createLegacyActionTypeMatcher<StorageAction>();

const getDeviceByAccountKey = (accountKey: AccountKey, state: AppState) => {
    const account = selectAccountByKey(state, accountKey);

    return account ? findAccountDevice(account, selectDevices(state)) : undefined;
};

type RememberedDeviceSaveParams<TAction> = {
    action: TAction;
    device: TrezorDevice;
};

type RememberedDeviceSaveDeps = {
    dispatch: Dispatch;
    getState: GetState;
};

type RememberedDeviceHandler = {
    match: ReadonlyArray<(action: StorageAction) => boolean>;
    getDevice: (action: any, state: AppState) => TrezorDevice | undefined;
    save: (params: RememberedDeviceSaveParams<any>, deps: RememberedDeviceSaveDeps) => void;
};

const defineRememberedDeviceHandler = <
    Matchers extends ReadonlyArray<(action: StorageAction) => boolean>,
>(handler: {
    match: readonly [...Matchers];
    getDevice: (
        action: ActionFromMatcher<Matchers[number]>,
        state: AppState,
    ) => TrezorDevice | undefined;
    save: (
        params: RememberedDeviceSaveParams<ActionFromMatcher<Matchers[number]>>,
        deps: RememberedDeviceSaveDeps,
    ) => void;
}): RememberedDeviceHandler => handler;

// Device-scoped data must be persisted only for remembered devices. Do not check
// getIsDeviceRemembered by hand — register a handler here and the loop in the middleware below
// applies the check based on the declared getDevice.
const rememberedDeviceHandlers: RememberedDeviceHandler[] = [
    defineRememberedDeviceHandler({
        match: [
            accountsActions.createAccount.match,
            accountsActions.changeAccountVisibility.match,
            accountsActions.updateAccount.match,
        ],
        getDevice: (action, state) => findAccountDevice(action.payload, selectDevices(state)),
        save: ({ action }, { dispatch }) => {
            const account = action.payload;

            if (!isAccountSuccessful(account)) {
                return;
            }

            storageActions.saveAccounts([account]);
            dispatch(storageActions.saveCoinjoinAccount(account.key));
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

            storageActions.saveAccounts(accounts);
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

            storageActions.saveAccounts([action.payload]);
        },
    }),
    defineRememberedDeviceHandler({
        match: [receiveActions.showAddress.match, receiveActions.setCurrentFreshAddress.match],
        getDevice: (action, state) => getDeviceByAccountKey(action.payload.accountKey, state),
        save: ({ action }, { dispatch }) => {
            dispatch(storageActions.saveAccountReceive(action.payload.accountKey));
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

            storageActions.removeAccountTransactions(account);
            dispatch(storageActions.saveAccountTransactions(account));
        },
    }),
    defineRememberedDeviceHandler({
        match: [transactionsActions.markTransactionAsNotScam.match],
        getDevice: (action, state) => getDeviceByAccountKey(action.payload.key, state),
        save: ({ action }, { dispatch, getState }) => {
            const account = selectAccountByKey(getState(), action.payload.key);

            if (account) {
                dispatch(storageActions.saveAccountTransactions(account));
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

            storageActions.removeAccountHistoricRates(account.key);

            const historicRates = selectHistoricFiatRates(getState());
            if (historicRates) {
                dispatch(storageActions.saveAccountHistoricRates(account.key, historicRates));
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

            (storageActions.saveAccounts([]) ?? Promise.resolve())
                // This is a bit strange workaround to ensure that device data will be stored after all account-related db transactions are settled,
                // in order not to persist successful discovery before persisting all its accounts
                .then(() => storageActions.saveDevice(device));
        },
    }),
    defineRememberedDeviceHandler({
        match: [suiteSettingsActions.setCoinjoinReceiveWarningHidden.match],
        getDevice: (_action, state) => selectSelectedDevice(state),
        save: (_params, { dispatch }) => {
            dispatch(storageActions.saveSuiteSettings());
        },
    }),
    defineRememberedDeviceHandler({
        match: [matchLegacyActionType(GRAPH.ACCOUNT_GRAPH_SUCCESS, GRAPH.ACCOUNT_GRAPH_FAIL)],
        getDevice: (action, state) =>
            selectDevices(state).find(
                device => device.state?.staticSessionId === action.payload.account.deviceState,
            ),
        save: ({ action }, { getState }) => {
            const { account } = action.payload;
            const graphEntry = getState().wallet.graph.data.find(
                d =>
                    d.account.deviceState === account.deviceState &&
                    d.account.descriptor === account.descriptor &&
                    d.account.symbol === account.symbol,
            );
            if (graphEntry) {
                storageActions.saveGraph([graphEntry]);
            }
        },
    }),
    defineRememberedDeviceHandler({
        match: [matchLegacyActionType(METADATA.SET_ERROR_FOR_DEVICE)],
        getDevice: (action, state) =>
            selectDeviceByStaticSessionId(state, action.payload.deviceState),
        save: ({ device }, { dispatch }) => {
            dispatch(storageActions.saveDeviceMetadataError(device));
        },
    }),
    defineRememberedDeviceHandler({
        // Au, this hurts, I need to call saveDevice manually. Saved device should be updated
        // automatically anytime any of its properties change.
        match: [matchLegacyActionType(METADATA.SET_DEVICE_METADATA)],
        getDevice: (action, state) =>
            selectDeviceByStaticSessionId(state, action.payload.deviceState),
        save: ({ action, device }) => {
            storageActions.saveDevice({
                ...device,
                metadata: action.payload.metadata,
            });
        },
    }),
    defineRememberedDeviceHandler({
        match: [
            matchLegacyActionType(
                COINJOIN.ACCOUNT_DISCOVERY_RESET,
                COINJOIN.ACCOUNT_DISCOVERY_PROGRESS,
                COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS,
                COINJOIN.ACCOUNT_UNREGISTER,
                COINJOIN.ACCOUNT_UPDATE_SETUP_OPTION,
                COINJOIN.ACCOUNT_UPDATE_TARGET_ANONYMITY,
                COINJOIN.ACCOUNT_UPDATE_MAX_MING_FEE,
                COINJOIN.ACCOUNT_TOGGLE_SKIP_ROUNDS,
            ),
        ],
        getDevice: (action, state) =>
            getDeviceByAccountKey(action.payload.accountKey as AccountKey, state),
        save: ({ action }, { dispatch }) => {
            dispatch(storageActions.saveCoinjoinAccount(action.payload.accountKey as AccountKey));
        },
    }),
];

export const storageMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => {
    db.onBlocking = () => api.dispatch({ type: STORAGE.ERROR, payload: 'blocking' });
    db.onBlocked = () => api.dispatch({ type: STORAGE.ERROR, payload: 'blocked' });

    return (next: Dispatch) =>
        (action: SuiteAction | WalletAction): SuiteAction | WalletAction => {
            // pass action
            next(action);

            // IMPORTANT: The single place enforcing that device-scoped data is persisted only for
            //            remembered devices (see rememberedDeviceHandlers above).
            rememberedDeviceHandlers.forEach(({ match, getDevice, save }) => {
                if (!match.some(matcher => matcher(action))) {
                    return;
                }

                const device = getDevice(action, api.getState());

                if (device && getIsDeviceRemembered(device)) {
                    save({ action, device }, { dispatch: api.dispatch, getState: api.getState });
                }
            });

            if (accountsActions.removeAccount.match(action)) {
                action.payload.forEach(storageActions.removeAccountWithDependencies(api.getState));
            }

            if (changeNetworks.match(action)) {
                api.dispatch(storageActions.saveWalletSettings());
            }

            if (transactionsActions.resetTransaction.match(action)) {
                const { account } = action.payload;

                storageActions.removeAccountTransactions(account);
                storageActions.removeAccountHistoricRates(account.key);
                storageActions.removeAccountPhishing(account.key);
            }

            if (phishingActions.setDustPhishing.match(action)) {
                api.dispatch(
                    storageActions.savePhishingMetadata({
                        dustPhishing: action.payload,
                    }),
                );
            }

            if (blockchainActions.setBackend.match(action)) {
                api.dispatch(storageActions.saveBackend(action.payload.symbol));
            }

            if (blockchainActions.setBackendGapLimit.match(action)) {
                api.dispatch(storageActions.saveBackend(action.payload.symbol));
            }

            if (explorerActions.setExplorer.match(action)) {
                storageActions.saveExplorer(action.payload);
            }

            if (
                isAnyOf(
                    messageSystemActions.fetchSuccessUpdate,
                    messageSystemActions.dismissMessage,
                    messageSystemActions.setConfigSource,
                )(action)
            ) {
                api.dispatch(storageActions.saveMessageSystem());
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
                api.dispatch(storageActions.saveAnalytics());
            }

            if (
                isAnyOf(
                    updateSuiteSyncDebugEnabled,
                    updateSuiteSyncEnabled,
                    dismissUnsupportedDeviceBanner,
                    setSuiteSyncRelayUrl,
                )(action)
            ) {
                api.dispatch(storageActions.saveSuiteSyncSettings());
            }

            if (setSuiteSyncOwner.match(action)) {
                api.dispatch(storageActions.saveSuiteSyncOwner(action.payload));
            }

            if (
                isAnyOf(
                    suiteSyncQuotaManagerActions.quotaManagerDeviceFetched,
                    suiteSyncQuotaManagerActions.updateQuotaManagerBaseUrl,
                    suiteSyncQuotaManagerActions.enforceQuotaManagerUpdated,
                    suiteSyncQuotaManagerActions.eraseFetchedData,
                )(action)
            ) {
                api.dispatch(storageActions.saveSuiteSyncQuotaManager());
            }

            if (deviceActions.setRememberDevice.match(action)) {
                const isAutoEjectEnabled = selectIsDeviceAutoEjectEnabled(api.getState());

                if (action.payload.remember && !isAutoEjectEnabled) {
                    api.dispatch(storageActions.rememberDevice(action.payload.device));
                } else {
                    api.dispatch(storageActions.forgetDevice(action.payload.device));
                }
            }

            if (deviceActions.forgetDevice.match(action)) {
                api.dispatch(storageActions.forgetDevice(action.payload.device));
            }

            if (tokenDefinitionsActions.setTokenStatus.match(action)) {
                api.dispatch(
                    storageActions.saveTokenManagement(
                        action.payload.symbol,
                        action.payload.type,
                        TokenManagementAction.HIDE,
                    ),
                );
                api.dispatch(
                    storageActions.saveTokenManagement(
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
                api.dispatch(storageActions.saveKnownDevices());
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
                api.dispatch(storageActions.saveConnectSettings());
            }

            if (firmwareActions.setFirmwareChannel.match(action)) {
                api.dispatch(storageActions.saveFirmwareSettings());
            }

            if (isAnyOf(featureUsed, feedbackRequested, feedbackDismissed)(action)) {
                api.dispatch(storageActions.saveFeatureFeedback());
            }

            if (
                thpActions.removeCredentials.match(action) ||
                action.type === 'device-thp_credentials_changed' ||
                (action.type === 'device-thp_pairing_status_changed' &&
                    action.payload.status === 'finished')
            ) {
                api.dispatch(storageActions.saveThpCredentials());
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
                api.dispatch(storageActions.savePersistentDeviceData());
            }

            if (discreetModeActions.setDiscreetMode.match(action)) {
                api.dispatch(storageActions.saveDiscreetMode());
            }

            switch (action.type) {
                case setBaseCurrency.type:
                case WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS:
                case WALLET_SETTINGS.SET_MEV_PROTECTION:
                case WALLET_SETTINGS.SET_NETWORK_RESERVE:
                case WALLET_SETTINGS.SET_AUTO_EJECT:
                case WALLET_SETTINGS.SET_ADDRESS_DISPLAY_TYPE:
                case WALLET_SETTINGS.TOGGLE_HIDE_SUSPICIOUS_TRANSACTIONS:
                    api.dispatch(storageActions.saveWalletSettings());

                    break;
                case suiteSettingsActions.setLanguage.type:
                case setFlag.type:
                case markNewContentIndicatorAsSeen.type:
                case setNewContentIndicatorSeen.type:
                case suiteSettingsActions.setDebugMode.type:
                case suiteSettingsActions.setExperimentalFeatures.type:
                case suiteSettingsActions.setOnionLinks.type:
                case suiteSettingsActions.setTheme.type:
                case suiteSettingsActions.setAutodetect.type:
                case suiteSettingsActions.setSidebarWidth.type:
                case suiteSettingsActions.toggleDeviceAuthenticityCheck.type:
                case suiteSettingsActions.toggleFirmwareRevisionCheck.type:
                case suiteSettingsActions.toggleFirmwareHashCheck.type:
                case suiteSettingsActions.toggleDeviceMetaChecks.type:
                case SUITE.EVM_CONFIRM_EXPLANATION_MODAL:
                case SUITE.EVM_CLOSE_EXPLANATION_BANNER:
                case suiteSettingsActions.setIsCoinsFilterVisible.type:
                    api.dispatch(storageActions.saveSuiteSettings());
                    break;
                case debugActions.setShowDebugMenu.type:
                    api.dispatch(storageActions.saveDebugSettings());
                    break;
                case tradingActions.saveTrade.type: {
                    const { type, ...trade } = action;
                    storageActions.saveTradingTrade(trade.payload);
                    break;
                }
                case METADATA.ENABLE:
                case METADATA.DISABLE:
                case METADATA.ADD_PROVIDER:
                case METADATA.REMOVE_PROVIDER:
                    api.dispatch(storageActions.saveMetadataSettings());
                    break;
                case COINJOIN.SET_DEBUG_SETTINGS:
                    api.dispatch(storageActions.saveCoinjoinDebugSettings());
                    break;

                // Not a rememberedDeviceHandlers entry: unlike those handlers (one action ->
                // one device), this one action affects multiple accounts on potentially
                // different devices, so the remembered-device check must be applied per account.
                case COINJOIN.CLIENT_PRISON_EVENT: {
                    const affectedAccounts = action.payload.map(inmate => inmate.accountKey);
                    const state = api.getState();
                    affectedAccounts.forEach(key => {
                        const device = getDeviceByAccountKey(key as AccountKey, state);
                        if (device && getIsDeviceRemembered(device)) {
                            api.dispatch(storageActions.saveCoinjoinAccount(key as AccountKey));
                        }
                    });
                    break;
                }

                default:
                    break;
            }

            return action;
        };
};
