import { MiddlewareAPI } from 'redux';
import { db } from '@suite/storage';

import { WALLET_SETTINGS } from '@settings-actions/constants';
import {
    DISCOVERY,
    TRANSACTION,
    FIAT_RATES,
    GRAPH,
    SEND,
    COINMARKET_COMMON,
    FORM_DRAFT,
    BLOCKCHAIN,
} from '@wallet-actions/constants';
import * as storageActions from '@suite-actions/storageActions';
import * as accountUtils from '@suite-common/wallet-utils';
import { SUITE, ANALYTICS, METADATA, MESSAGE_SYSTEM, STORAGE } from '@suite-actions/constants';
import { FIRMWARE } from '@firmware-actions/constants';
import { getDiscovery } from '@wallet-actions/discoveryActions';
import { isDeviceRemembered } from '@suite-utils/device';
import { serializeDiscovery } from '@suite-utils/storage';
import { FormDraftPrefixKeyValues } from '@suite-common/wallet-constants';

import type { AppState, Action as SuiteAction, Dispatch } from '@suite-types';
import type { WalletAction } from '@wallet-types';
import { accountsActions } from '@suite-common/wallet-core';

const storageMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => {
    db.onBlocking = () => api.dispatch({ type: STORAGE.ERROR, payload: 'blocking' });
    db.onBlocked = () => api.dispatch({ type: STORAGE.ERROR, payload: 'blocked' });
    return (next: Dispatch) =>
        (action: SuiteAction | WalletAction): SuiteAction | WalletAction => {
            // pass action
            next(action);

            if (
                accountsActions.createAccount.match(action) ||
                accountsActions.changeAccountVisibility.match(action) ||
                accountsActions.updateAccount.match(action)
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

                case TRANSACTION.ADD:
                case TRANSACTION.REMOVE: {
                    const { account } = action.payload;
                    const device = accountUtils.findAccountDevice(account, api.getState().devices);
                    // update only transactions for remembered device
                    if (isDeviceRemembered(device)) {
                        storageActions.removeAccountTransactions(account);
                        api.dispatch(storageActions.saveAccountTransactions(account));
                    }
                    break;
                }

                case TRANSACTION.RESET:
                    storageActions.removeAccountTransactions(action.account);
                    break;

                case DISCOVERY.UPDATE:
                case DISCOVERY.INTERRUPT:
                case DISCOVERY.STOP:
                case DISCOVERY.COMPLETE: {
                    const { deviceState } = action.payload;
                    const device = api.getState().devices.find(d => d.state === deviceState);
                    // update discovery for remembered device
                    if (isDeviceRemembered(device)) {
                        const discovery = api.dispatch(getDiscovery(deviceState));
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

                case WALLET_SETTINGS.CHANGE_NETWORKS:
                    api.dispatch(storageActions.saveWalletSettings());
                    api.dispatch(storageActions.saveFiatRates());
                    break;

                case WALLET_SETTINGS.SET_HIDE_BALANCE:
                case WALLET_SETTINGS.SET_LOCAL_CURRENCY:
                case WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS:
                case WALLET_SETTINGS.SET_LAST_USED_FEE_LEVEL:
                    api.dispatch(storageActions.saveWalletSettings());
                    break;

                case BLOCKCHAIN.SET_BACKEND:
                    api.dispatch(storageActions.saveBackend(action.payload.coin));
                    break;

                case SUITE.SET_LANGUAGE:
                case SUITE.SET_FLAG:
                case SUITE.SET_DEBUG_MODE:
                case SUITE.ONION_LINKS:
                case SUITE.SET_THEME:
                case SUITE.SET_AUTODETECT:
                    api.dispatch(storageActions.saveSuiteSettings());
                    break;

                case FIAT_RATES.RATE_UPDATE:
                    api.dispatch(storageActions.saveFiatRates());
                    break;

                case FIAT_RATES.RATE_REMOVE:
                    api.dispatch(
                        storageActions.removeFiatRate(
                            action.payload.symbol,
                            action.payload.tokenAddress,
                        ),
                    );
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
                case METADATA.ACCOUNT_ADD:
                case METADATA.ACCOUNT_LOADED: {
                    const device = accountUtils.findAccountDevice(
                        action.payload,
                        api.getState().devices,
                    );
                    // if device is remembered, and there is a change in account.metadata (METADATA.ACCOUNT_LOADED), update database
                    if (isDeviceRemembered(device)) {
                        storageActions.saveAccounts([action.payload]);
                    }
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

                default:
                    break;
            }
            return action;
        };
};

export default storageMiddleware;
