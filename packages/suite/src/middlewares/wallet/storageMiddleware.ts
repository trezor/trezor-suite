import { MiddlewareAPI } from 'redux';
import { isAnyOf } from '@reduxjs/toolkit';

import {
    selectDevices,
    selectDevice,
    firmwareActions,
    discoveryActions,
    selectDiscoveryByDeviceState,
    accountsActions,
    blockchainActions,
    transactionsActions,
    fiatRatesActions,
    selectAccountByKey,
    deviceActions,
    selectDeviceByState,
} from '@suite-common/wallet-core';
import { isDeviceRemembered } from '@suite-common/suite-utils';
import { messageSystemActions } from '@suite-common/message-system';
import { findAccountDevice } from '@suite-common/wallet-utils';
import { analyticsActions } from '@suite-common/analytics';

import { db } from 'src/storage';
import { WALLET_SETTINGS } from 'src/actions/settings/constants';
import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import { GRAPH, SEND, COINMARKET_COMMON, FORM_DRAFT } from 'src/actions/wallet/constants';
import * as COINJOIN from 'src/actions/wallet/constants/coinjoinConstants';
import * as storageActions from 'src/actions/suite/storageActions';
import { SUITE, METADATA, STORAGE } from 'src/actions/suite/constants';
import * as metadataActions from 'src/actions/suite/metadataActions';
import { serializeDiscovery } from 'src/utils/suite/storage';
import type { AppState, Action as SuiteAction, Dispatch } from 'src/types/suite';
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
                const { payload } = action;
                const device = findAccountDevice(payload, selectDevices(api.getState()));
                // update only transactions for remembered device
                if (isDeviceRemembered(device)) {
                    storageActions.saveAccounts([payload]);
                    api.dispatch(storageActions.saveCoinjoinAccount(payload.key));
                }
            }

            if (accountsActions.removeAccount.match(action)) {
                action.payload.forEach(storageActions.removeAccountWithDependencies(api.getState));
            }

            if (isAnyOf(metadataActions.setAccountAdd)(action)) {
                const device = findAccountDevice(action.payload, selectDevices(api.getState()));
                // if device is remembered, and there is a change in account.metadata (metadataActions.setAccountLoaded), update database
                if (isDeviceRemembered(device)) {
                    storageActions.saveAccounts([action.payload]);
                }
            }

            if (fiatRatesActions.updateFiatRate.match(action)) {
                api.dispatch(storageActions.saveFiatRates());
            }

            if (fiatRatesActions.removeFiatRate.match(action)) {
                api.dispatch(
                    storageActions.removeFiatRate(
                        action.payload.symbol,
                        action.payload.tokenAddress,
                    ),
                );
            }

            if (walletSettingsActions.changeNetworks.match(action)) {
                api.dispatch(storageActions.saveWalletSettings());
                api.dispatch(storageActions.saveFiatRates());
            }

            if (transactionsActions.resetTransaction.match(action)) {
                storageActions.removeAccountTransactions(action.payload.account);
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

            if (blockchainActions.setBackend.match(action)) {
                api.dispatch(storageActions.saveBackend(action.payload.coin));
            }

            if (
                isAnyOf(
                    discoveryActions.updateDiscovery,
                    discoveryActions.interruptDiscovery,
                    discoveryActions.completeDiscovery,
                    discoveryActions.stopDiscovery,
                )(action)
            ) {
                const { deviceState } = action.payload;
                const devices = selectDevices(api.getState());
                const device = devices.find(d => d.state === deviceState);
                // update discovery for remembered device
                if (isDeviceRemembered(device)) {
                    const discovery = selectDiscoveryByDeviceState(api.getState(), deviceState);
                    if (discovery) {
                        storageActions.saveDiscovery([serializeDiscovery(discovery)]);
                    }
                }
            }

            if (
                isAnyOf(
                    messageSystemActions.fetchSuccessUpdate,
                    messageSystemActions.dismissMessage,
                )(action)
            ) {
                api.dispatch(storageActions.saveMessageSystem());
            }

            if (
                isAnyOf(
                    analyticsActions.initAnalytics,
                    analyticsActions.enableAnalytics,
                    analyticsActions.disableAnalytics,
                )(action)
            ) {
                api.dispatch(storageActions.saveAnalytics());
            }

            if (deviceActions.rememberDevice.match(action)) {
                api.dispatch(
                    storageActions.rememberDevice(
                        action.payload.device,
                        action.payload.remember,
                        action.payload.forceRemember,
                    ),
                );
            }

            if (deviceActions.forgetDevice.match(action)) {
                api.dispatch(storageActions.forgetDevice(action.payload));
                api.dispatch(storageActions.forgetDeviceMetadataError(action.payload));
            }

            if (deviceActions.updateSelectedDevice.match(action)) {
                if (isDeviceRemembered(action.payload) && action.payload?.mode === 'normal') {
                    storageActions.saveDevice(action.payload);
                }
            }

            switch (action.type) {
                case WALLET_SETTINGS.SET_HIDE_BALANCE:
                case walletSettingsActions.setLocalCurrency.type:
                case WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS:
                case WALLET_SETTINGS.SET_LAST_USED_FEE_LEVEL:
                    api.dispatch(storageActions.saveWalletSettings());
                    break;

                case SUITE.SET_LANGUAGE:
                case SUITE.SET_FLAG:
                case SUITE.SET_DEBUG_MODE:
                case SUITE.ONION_LINKS:
                case SUITE.SET_THEME:
                case SUITE.SET_ADDRESS_DISPLAY_TYPE:
                case SUITE.SET_AUTODETECT:
                case SUITE.DESKTOP_SUITE_PROMO:
                case SUITE.DEVICE_AUTHENTICITY_OPT_OUT:
                    api.dispatch(storageActions.saveSuiteSettings());
                    break;
                case SUITE.COINJOIN_RECEIVE_WARNING: {
                    const device = selectDevice(api.getState());
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
                        d => d.state === action.payload.account.deviceState,
                    );
                    if (isDeviceRemembered(device)) {
                        storageActions.saveGraph([action.payload]);
                    }
                    break;
                }
                case SEND.STORE_DRAFT: {
                    const device = selectDevice(api.getState());
                    // save drafts for remembered device
                    if (isDeviceRemembered(device)) {
                        storageActions.saveDraft(action.formState, action.key);
                    }
                    break;
                }
                case SEND.REMOVE_DRAFT:
                    storageActions.removeDraft(action.key);
                    break;
                case COINMARKET_COMMON.SAVE_TRADE: {
                    const { type, ...trade } = action;
                    storageActions.saveCoinmarketTrade(trade);
                    break;
                }
                case METADATA.ENABLE:
                case METADATA.DISABLE:
                case METADATA.ADD_PROVIDER:
                case METADATA.REMOVE_PROVIDER:
                    api.dispatch(storageActions.saveMetadataSettings());
                    break;
                case METADATA.SET_ERROR_FOR_DEVICE: {
                    const device = selectDeviceByState(api.getState(), action.payload.deviceState);
                    if (isDeviceRemembered(device) && device) {
                        api.dispatch(storageActions.saveDeviceMetadataError(device));
                    }
                    break;
                }
                // au, this hurts, I need to call saveDevice manually. saved device should be updated automatically
                // anytime any of its properties change
                case METADATA.SET_DEVICE_METADATA: {
                    const device = selectDeviceByState(api.getState(), action.payload.deviceState);
                    if (isDeviceRemembered(device) && device) {
                        storageActions.saveDevice({
                            ...device,
                            metadata: action.payload.metadata,
                        });
                    }
                    break;
                }
                case FORM_DRAFT.STORE_DRAFT: {
                    const device = selectDevice(api.getState());
                    // save drafts for remembered device
                    if (isDeviceRemembered(device)) {
                        storageActions.saveFormDraft(action.key, action.formDraft);
                    }
                    break;
                }
                case FORM_DRAFT.REMOVE_DRAFT:
                    storageActions.removeFormDraft(action.key);
                    break;
                case firmwareActions.setHashInvalid.type:
                    api.dispatch(storageActions.saveFirmware());
                    break;

                case COINJOIN.ACCOUNT_DISCOVERY_RESET:
                case COINJOIN.ACCOUNT_DISCOVERY_PROGRESS:
                case COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS:
                case COINJOIN.ACCOUNT_UNREGISTER:
                case COINJOIN.ACCOUNT_UPDATE_SETUP_OPTION:
                case COINJOIN.ACCOUNT_UPDATE_TARGET_ANONYMITY:
                case COINJOIN.ACCOUNT_UPDATE_MAX_MING_FEE:
                case COINJOIN.ACCOUNT_TOGGLE_SKIP_ROUNDS: {
                    const account = selectAccountByKey(api.getState(), action.payload.accountKey);
                    const device =
                        account && findAccountDevice(account, selectDevices(api.getState()));
                    if (device && isDeviceRemembered(device)) {
                        api.dispatch(storageActions.saveCoinjoinAccount(action.payload.accountKey));
                    }
                    break;
                }
                case COINJOIN.CLIENT_PRISON_EVENT: {
                    const affectedAccounts = action.payload.map(inmate => inmate.accountKey);
                    const state = api.getState();
                    const devices = selectDevices(state);
                    affectedAccounts.forEach(key => {
                        const account = selectAccountByKey(state, key);
                        const device = account && findAccountDevice(account, devices);
                        if (device && isDeviceRemembered(device)) {
                            api.dispatch(storageActions.saveCoinjoinAccount(key));
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
