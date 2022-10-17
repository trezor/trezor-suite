import { MiddlewareAPI } from 'redux';
import { db } from '@suite/storage';

import { WALLET_SETTINGS } from '@settings-actions/constants';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { DISCOVERY, GRAPH, SEND, COINMARKET_COMMON, FORM_DRAFT } from '@wallet-actions/constants';
import * as COINJOIN from '@wallet-actions/constants/coinjoinConstants';
import * as storageActions from '@suite-actions/storageActions';
import * as accountUtils from '@suite-common/wallet-utils';
import { SUITE, ANALYTICS, METADATA, MESSAGE_SYSTEM, STORAGE } from '@suite-actions/constants';
import { FIRMWARE } from '@firmware-actions/constants';
import { selectDiscovery } from '@wallet-reducers/discoveryReducer';
import * as metadataActions from '@suite-actions/metadataActions';
import { isDeviceRemembered } from '@suite-utils/device';
import { serializeDiscovery } from '@suite-utils/storage';
import { FormDraftPrefixKeyValues } from '@suite-common/wallet-constants';

import type { AppState, Action as SuiteAction, Dispatch } from '@suite-types';
import type { WalletAction } from '@wallet-types';
import {
    accountsActions,
    blockchainActions,
    transactionsActions,
    fiatRatesActions,
} from '@suite-common/wallet-core';
import { isAnyOf } from '@reduxjs/toolkit';

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
                const device = accountUtils.findAccountDevice(payload, api.getState().devices);
                // update only transactions for remembered device
                if (isDeviceRemembered(device)) {
                    storageActions.saveAccounts([payload]);
                }
            }

            if (accountsActions.removeAccount.match(action)) {
                action.payload.forEach(account => {
                    FormDraftPrefixKeyValues.map(prefix =>
                        storageActions.removeAccountFormDraft(prefix, account.key),
                    );
                    storageActions.removeAccountDraft(account);
                    storageActions.removeAccountTransactions(account);
                    storageActions.removeAccountGraph(account);
                    storageActions.removeAccount(account);
                });
            }

            if (isAnyOf(metadataActions.setAccountLoaded, metadataActions.setAccountAdd)(action)) {
                const device = accountUtils.findAccountDevice(
                    action.payload,
                    api.getState().devices,
                );
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
                const device = accountUtils.findAccountDevice(account, api.getState().devices);
                // update only transactions for remembered device
                if (isDeviceRemembered(device)) {
                    storageActions.removeAccountTransactions(account);
                    api.dispatch(storageActions.saveAccountTransactions(account));
                }
            }

            if (blockchainActions.setBackend.match(action)) {
                api.dispatch(storageActions.saveBackend(action.payload.coin));
            }

            switch (action.type) {
                case SUITE.REMEMBER_DEVICE:
                    api.dispatch(
                        storageActions.rememberDevice(
                            action.payload,
                            action.remember,
                            action.forceRemember,
                        ),
                    );
                    break;

                case SUITE.FORGET_DEVICE:
                    api.dispatch(storageActions.forgetDevice(action.payload));
                    break;

                case DISCOVERY.UPDATE:
                case DISCOVERY.INTERRUPT:
                case DISCOVERY.STOP:
                case DISCOVERY.COMPLETE: {
                    const { deviceState } = action.payload;
                    const device = api.getState().devices.find(d => d.state === deviceState);
                    // update discovery for remembered device
                    if (isDeviceRemembered(device)) {
                        const discovery = selectDiscovery(api.getState(), deviceState);
                        if (discovery) {
                            storageActions.saveDiscovery([serializeDiscovery(discovery)]);
                        }
                    }
                    break;
                }

                case SUITE.UPDATE_SELECTED_DEVICE:
                    if (isDeviceRemembered(action.payload) && action.payload.mode === 'normal') {
                        storageActions.saveDevice(action.payload);
                    }
                    break;

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
                case SUITE.SET_AUTODETECT:
                    api.dispatch(storageActions.saveSuiteSettings());
                    break;

                case ANALYTICS.INIT:
                case ANALYTICS.ENABLE:
                case ANALYTICS.DISABLE:
                    api.dispatch(storageActions.saveAnalytics());
                    break;

                case GRAPH.ACCOUNT_GRAPH_SUCCESS:
                case GRAPH.ACCOUNT_GRAPH_FAIL: {
                    const device = api
                        .getState()
                        .devices.find(d => d.state === action.payload.account.deviceState);
                    if (isDeviceRemembered(device)) {
                        storageActions.saveGraph([action.payload]);
                    }
                    break;
                }
                case SEND.STORE_DRAFT: {
                    const { device } = api.getState().suite;
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
                case METADATA.SET_PROVIDER:
                    api.dispatch(storageActions.saveMetadata());
                    break;

                case MESSAGE_SYSTEM.FETCH_CONFIG_SUCCESS_UPDATE:
                case MESSAGE_SYSTEM.DISMISS_MESSAGE:
                    api.dispatch(storageActions.saveMessageSystem());
                    break;

                case FORM_DRAFT.STORE_DRAFT: {
                    const { device } = api.getState().suite;
                    // save drafts for remembered device
                    if (isDeviceRemembered(device)) {
                        storageActions.saveFormDraft(action.key, action.formDraft);
                    }
                    break;
                }
                case FORM_DRAFT.REMOVE_DRAFT:
                    storageActions.removeFormDraft(action.key);
                    break;
                case FIRMWARE.SET_HASH_INVALID:
                    api.dispatch(storageActions.saveFirmware());
                    break;

                case COINJOIN.ACCOUNT_CREATE:
                    api.dispatch(storageActions.saveCoinjoinAccount(action.payload.account.key));
                    break;
                case COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS:
                case COINJOIN.ACCOUNT_UNREGISTER:
                case COINJOIN.ACCOUNT_UPDATE_TARGET_ANONYMITY:
                    api.dispatch(storageActions.saveCoinjoinAccount(action.payload.accountKey));
                    break;
                case COINJOIN.ACCOUNT_REMOVE:
                    storageActions.removeCoinjoinAccount(action.payload.accountKey);
                    break;

                default:
                    break;
            }
            return action;
        };
};

export default storageMiddleware;
