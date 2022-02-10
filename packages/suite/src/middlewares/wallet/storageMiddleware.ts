import { MiddlewareAPI } from 'redux';

import { WALLET_SETTINGS } from '@settings-actions/constants';
import {
    ACCOUNT,
    DISCOVERY,
    TRANSACTION,
    FIAT_RATES,
    GRAPH,
    SEND,
    COINMARKET_COMMON,
    FORM_DRAFT,
} from '@wallet-actions/constants';
import * as storageActions from '@suite-actions/storageActions';
import * as accountUtils from '@wallet-utils/accountUtils';
import { SUITE, ANALYTICS, METADATA, MESSAGE_SYSTEM } from '@suite-actions/constants';
import { getDiscovery } from '@wallet-actions/discoveryActions';
import { isDeviceRemembered } from '@suite-utils/device';
import { serializeDiscovery } from '@suite-utils/storage';
import { FormDraftPrefixKeyValues } from '@wallet-constants/formDraft';

import type { AppState, Action as SuiteAction, Dispatch } from '@suite-types';
import type { WalletAction } from '@wallet-types';

const storageMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: SuiteAction | WalletAction): SuiteAction | WalletAction => {
        // pass action
        next(action);

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

            case ACCOUNT.CREATE:
            case ACCOUNT.CHANGE_VISIBILITY:
            case ACCOUNT.UPDATE: {
                const device = accountUtils.findAccountDevice(
                    action.payload,
                    api.getState().devices,
                );
                // update only transactions for remembered device
                if (isDeviceRemembered(device)) {
                    storageActions.saveAccounts([action.payload]);
                }
                break;
            }

            case ACCOUNT.REMOVE: {
                action.payload.forEach(account => {
                    FormDraftPrefixKeyValues.map(prefix =>
                        storageActions.removeAccountFormDraft(prefix, account.key),
                    );
                    storageActions.removeAccountDraft(account);
                    storageActions.removeAccountTransactions(account);
                    storageActions.removeAccountGraph(account);
                    storageActions.removeAccount(account);
                });
                break;
            }

            case TRANSACTION.ADD:
            case TRANSACTION.REMOVE: {
                const device = accountUtils.findAccountDevice(
                    action.account,
                    api.getState().devices,
                );
                // update only transactions for remembered device
                if (isDeviceRemembered(device)) {
                    storageActions.removeAccountTransactions(action.account);
                    api.dispatch(storageActions.saveAccountTransactions(action.account));
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
            case WALLET_SETTINGS.SET_LAST_USED_FEE_LEVEL:
            case WALLET_SETTINGS.SET_BACKEND:
            case WALLET_SETTINGS.REMOVE_BACKEND:
            case WALLET_SETTINGS.SET_CARDANO_DERIVATION_TYPE:
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
            case ANALYTICS.DISPOSE:
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
            case COINMARKET_COMMON.SAVE_TRADE:
                storageActions.saveCoinmarketTrade(
                    action.data,
                    {
                        descriptor: action.account.descriptor,
                        symbol: action.account.symbol,
                        accountType: action.account.accountType,
                        accountIndex: action.account.accountIndex,
                    },
                    action.date,
                    action.tradeType,
                    action.key,
                );
                break;

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

            default:
                break;
        }
        return action;
    };

export default storageMiddleware;
