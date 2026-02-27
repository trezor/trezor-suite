import { isAnyOf } from '@reduxjs/toolkit';
import { MiddlewareAPI } from 'redux';

import { featureUsed, feedbackDismissed, feedbackRequested } from '@suite/experimental-feedback';
import { METADATA, metadataActions } from '@suite/metadata';
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
import { firmwareActions } from '@suite-common/firmware';
import { messageSystemActions } from '@suite-common/message-system';
import {
    setSuiteSyncOwner,
    setSuiteSyncRelayUrl,
    updateSuiteSyncDebugEnabled,
    updateSuiteSyncEnabled,
} from '@suite-common/suite-sync';
import { suiteSyncQuotaManagerActions } from '@suite-common/suite-sync-quota-manager';
import { isDeviceRemembered } from '@suite-common/suite-utils';
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
    selectAccountByKey,
    selectAccountsByDeviceState,
    selectHistoricFiatRates,
    selectIsDeviceAutoEjectEnabled,
    setBaseCurrency,
    transactionsActions,
    updateTxsFiatRatesThunk,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { findAccountDevice, isAccountSuccessful } from '@suite-common/wallet-utils';
import { walletConnectActions } from '@suite-common/walletconnect';

import { STORAGE, SUITE } from 'src/actions/suite/constants';
import * as storageActions from 'src/actions/suite/storageActions';
import { GRAPH } from 'src/actions/wallet/constants';
import * as COINJOIN from 'src/actions/wallet/constants/coinjoinConstants';
import { db } from 'src/storage';
import type { AppState, Dispatch, Action as SuiteAction } from 'src/types/suite';
import type { WalletAction } from 'src/types/wallet';

const storageMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => {
    db.onBlocking = () => api.dispatch({ type: STORAGE.ERROR, payload: 'blocking' });
    db.onBlocked = () => api.dispatch({ type: STORAGE.ERROR, payload: 'blocked' });

    return (next: Dispatch) =>
        (action: SuiteAction | WalletAction): SuiteAction | WalletAction => {
            // pass action
            next(action);

            if (
                isAnyOf(
                    accountsActions.createAccount,
                    accountsActions.changeAccountVisibility,
                    accountsActions.updateAccount,
                )(action)
            ) {
                const newAccount = action.payload;
                const state = api.getState();
                const device = findAccountDevice(newAccount, selectDevices(state));

                // update only transactions for remembered device
                if (isDeviceRemembered(device) && isAccountSuccessful(newAccount)) {
                    storageActions.saveAccounts([newAccount]);
                    api.dispatch(storageActions.saveCoinjoinAccount(newAccount.key));
                }
            }

            if (isAnyOf(deviceActions.setDeviceState, deviceActions.addAuthorizedDevice)(action)) {
                const device = selectDeviceByState(api.getState(), action.payload.state);

                // When setDeviceState/addAuthorizedDevice is dispatched for passphrase wallet,
                // it means that its device was just created, but already discovered accounts
                // may have not been persisted, so try to do it now
                if (device && !device.useEmptyPassphrase && isDeviceRemembered(device)) {
                    const accounts = selectAccountsByDeviceState(
                        api.getState(),
                        action.payload.state,
                    ).filter(isAccountSuccessful);

                    storageActions.saveAccounts(accounts);
                }
            }

            if (accountsActions.removeAccount.match(action)) {
                action.payload.forEach(storageActions.removeAccountWithDependencies(api.getState));
            }

            if (isAnyOf(metadataActions.setAccountAdd)(action)) {
                const device = findAccountDevice(action.payload, selectDevices(api.getState()));
                // if device is remembered, and there is a change in account.metadata (metadataActions.setAccountLoaded), update database
                if (isDeviceRemembered(device) && isAccountSuccessful(action.payload)) {
                    storageActions.saveAccounts([action.payload]);
                }
            }

            if (changeNetworks.match(action)) {
                api.dispatch(storageActions.saveWalletSettings());
            }

            if (transactionsActions.resetTransaction.match(action)) {
                const { account } = action.payload;

                storageActions.removeAccountTransactions(account);
                storageActions.removeAccountHistoricRates(account.key);
            }

            if (
                isAnyOf(
                    transactionsActions.addTransaction,
                    transactionsActions.removeTransaction,
                )(action)
            ) {
                const { account } = action.payload;
                const device = findAccountDevice(account, selectDevices(api.getState()));
                // update only transactions for remembered device
                if (isDeviceRemembered(device)) {
                    storageActions.removeAccountTransactions(account);
                    api.dispatch(storageActions.saveAccountTransactions(account));
                }
            }

            if (
                isAnyOf(
                    transactionsActions.removeTransaction,
                    updateTxsFiatRatesThunk.fulfilled,
                )(action)
            ) {
                const { account } = action.payload;
                // TS doesn't know return type of updateTxsFiatRatesThunk.fulfilled, investigate why
                if (account) {
                    const device = findAccountDevice(account, selectDevices(api.getState()));
                    const historicRates = selectHistoricFiatRates(api.getState());
                    // update only historic rates for remembered device
                    if (isDeviceRemembered(device)) {
                        storageActions.removeAccountHistoricRates(account.key);
                        if (historicRates) {
                            api.dispatch(
                                storageActions.saveAccountHistoricRates(account.key, historicRates),
                            );
                        }
                    }
                }
            }

            if (blockchainActions.setBackend.match(action)) {
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
                )
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

            if (deviceActions.updateSelectedDevice.match(action)) {
                const isAutoEjectEnabled = selectIsDeviceAutoEjectEnabled(api.getState());

                if (
                    isDeviceRemembered(action.payload) &&
                    action.payload?.mode === 'normal' &&
                    !isAutoEjectEnabled
                ) {
                    (storageActions.saveAccounts([]) ?? Promise.resolve())
                        // This is a bit strange workaround to ensure that device data will be stored after all account-related db transactions are settled,
                        // in order not to persist successful discovery before persisting all its accounts
                        .then(() => storageActions.saveDevice(action.payload));
                }
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
                api.dispatch(storageActions.saveExperimentalFeedback());
            }

            if (
                deviceActions.setThpCredentials.match(action) ||
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
                    deviceActions.clearDevicePersistentData,
                )(action)
            ) {
                api.dispatch(storageActions.savePersistentDeviceData());
            }

            switch (action.type) {
                case WALLET_SETTINGS.SET_HIDE_BALANCE:
                case setBaseCurrency.type:
                case WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS:
                case WALLET_SETTINGS.SET_MEV_PROTECTION:
                case WALLET_SETTINGS.SET_NETWORK_RESERVE:
                case WALLET_SETTINGS.SET_AUTO_EJECT:
                    api.dispatch(storageActions.saveWalletSettings());

                    break;
                case SUITE.SET_LANGUAGE:
                case SUITE.SET_FLAG:
                case SUITE.SET_DEBUG_MODE:
                case SUITE.SET_EXPERIMENTAL_FEATURES:
                case SUITE.ONION_LINKS:
                case SUITE.SET_THEME:
                case SUITE.SET_ADDRESS_DISPLAY_TYPE:
                case SUITE.SET_AUTODETECT:
                case SUITE.SET_SIDEBAR_WIDTH:
                case SUITE.TOGGLE_DEVICE_AUTHENTICITY_CHECK:
                case SUITE.TOGGLE_FIRMWARE_REVISION_CHECK:
                case SUITE.TOGGLE_FIRMWARE_HASH_CHECK:
                case SUITE.EVM_CONFIRM_EXPLANATION_MODAL:
                case SUITE.EVM_CLOSE_EXPLANATION_BANNER:
                case SUITE.SET_IS_COINS_FILTER_VISIBLE:
                    api.dispatch(storageActions.saveSuiteSettings());
                    break;
                case SUITE.COINJOIN_RECEIVE_WARNING: {
                    const device = selectSelectedDevice(api.getState());
                    const isWalletRemembered = device?.remember;

                    if (!isWalletRemembered) {
                        break;
                    }

                    api.dispatch(storageActions.saveSuiteSettings());
                    break;
                }

                case GRAPH.ACCOUNT_GRAPH_SUCCESS:
                case GRAPH.ACCOUNT_GRAPH_FAIL: {
                    const devices = selectDevices(api.getState());
                    const device = devices.find(
                        d => d.state?.staticSessionId === action.payload.account.deviceState,
                    );
                    if (isDeviceRemembered(device)) {
                        storageActions.saveGraph([action.payload]);
                    }
                    break;
                }
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
                case METADATA.SET_ERROR_FOR_DEVICE: {
                    const device = selectDeviceByStaticSessionId(
                        api.getState(),
                        action.payload.deviceState,
                    );
                    if (isDeviceRemembered(device) && device) {
                        api.dispatch(storageActions.saveDeviceMetadataError(device));
                    }
                    break;
                }
                // au, this hurts, I need to call saveDevice manually. saved device should be updated automatically
                // anytime any of its properties change
                case METADATA.SET_DEVICE_METADATA: {
                    const device = selectDeviceByStaticSessionId(
                        api.getState(),
                        action.payload.deviceState,
                    );
                    if (isDeviceRemembered(device) && device) {
                        storageActions.saveDevice({
                            ...device,
                            metadata: action.payload.metadata,
                        });
                    }
                    break;
                }

                case COINJOIN.ACCOUNT_DISCOVERY_RESET:
                case COINJOIN.ACCOUNT_DISCOVERY_PROGRESS:
                case COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS:
                case COINJOIN.ACCOUNT_UNREGISTER:
                case COINJOIN.ACCOUNT_UPDATE_SETUP_OPTION:
                case COINJOIN.ACCOUNT_UPDATE_TARGET_ANONYMITY:
                case COINJOIN.ACCOUNT_UPDATE_MAX_MING_FEE:
                case COINJOIN.ACCOUNT_TOGGLE_SKIP_ROUNDS: {
                    const account = selectAccountByKey(
                        api.getState(),
                        action.payload.accountKey as AccountKey,
                    );
                    const device =
                        account && findAccountDevice(account, selectDevices(api.getState()));
                    if (device && isDeviceRemembered(device)) {
                        api.dispatch(
                            storageActions.saveCoinjoinAccount(
                                action.payload.accountKey as AccountKey,
                            ),
                        );
                    }
                    break;
                }
                case COINJOIN.CLIENT_PRISON_EVENT: {
                    const affectedAccounts = action.payload.map(inmate => inmate.accountKey);
                    const state = api.getState();
                    const devices = selectDevices(state);
                    affectedAccounts.forEach(key => {
                        const account = selectAccountByKey(state, key as AccountKey);
                        const device = account && findAccountDevice(account, devices);
                        if (device && isDeviceRemembered(device)) {
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

export default storageMiddleware;
