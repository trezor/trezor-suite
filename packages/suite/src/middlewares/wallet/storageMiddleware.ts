import { MiddlewareAPI } from 'redux';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import {
    ACCOUNT,
    DISCOVERY,
    TRANSACTION,
    FIAT_RATES,
    GRAPH,
    COINMARKET_BUY,
    SEND,
    COINMARKET_EXCHANGE,
} from '@wallet-actions/constants';
import * as storageActions from '@suite-actions/storageActions';
import * as accountUtils from '@wallet-utils/accountUtils';
import { SUITE, ANALYTICS, METADATA } from '@suite-actions/constants';
import { AppState, Action as SuiteAction, Dispatch } from '@suite-types';
import { WalletAction } from '@wallet-types';

import { getDiscovery } from '@wallet-actions/discoveryActions';
import { isDeviceRemembered } from '@suite-utils/device';
import { serializeDiscovery } from '@suite-utils/storage';

const storageMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: SuiteAction | WalletAction,
): SuiteAction | WalletAction => {
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
            const device = accountUtils.findAccountDevice(action.payload, api.getState().devices);
            // update only transactions for remembered device
            if (isDeviceRemembered(device)) {
                storageActions.saveAccounts([action.payload]);
            }
            break;
        }

        case ACCOUNT.REMOVE: {
            action.payload.forEach(account => {
                storageActions.removeAccount(account);
                storageActions.removeAccountTransactions(account);
                storageActions.removeAccountGraph(account);
            });
            break;
        }

        case TRANSACTION.ADD:
        case TRANSACTION.REMOVE: {
            const device = accountUtils.findAccountDevice(action.account, api.getState().devices);
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
            if (isDeviceRemembered(action.payload)) {
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
        case WALLET_SETTINGS.SET_BLOCKBOOK_URLS:
        case WALLET_SETTINGS.REMOVE_BLOCKBOOK_URL:
        case WALLET_SETTINGS.CLEAR_TOR_BLOCKBOOK_URLS:
            api.dispatch(storageActions.saveWalletSettings());
            break;

        case SUITE.SET_LANGUAGE:
        case SUITE.SET_FLAG:
        case SUITE.SET_DEBUG_MODE:
        case SUITE.ONION_LINKS:
        case SUITE.SET_THEME:
            api.dispatch(storageActions.saveSuiteSettings());
            break;

        case FIAT_RATES.RATE_UPDATE:
            api.dispatch(storageActions.saveFiatRates());
            break;

        case FIAT_RATES.RATE_REMOVE:
            api.dispatch(
                storageActions.removeFiatRate(action.payload.symbol, action.payload.tokenAddress),
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

        case COINMARKET_BUY.SAVE_TRADE:
            storageActions.saveBuyTrade(
                action.data,
                {
                    descriptor: action.account.descriptor,
                    symbol: action.account.symbol,
                    accountType: action.account.accountType,
                    accountIndex: action.account.accountIndex,
                },
                action.date,
            );
            break;

        case COINMARKET_EXCHANGE.SAVE_TRADE:
            storageActions.saveExchangeTrade(
                action.data,
                {
                    descriptor: action.account.descriptor,
                    symbol: action.account.symbol,
                    accountType: action.account.accountType,
                    accountIndex: action.account.accountIndex,
                },
                action.date,
            );
            break;

        case METADATA.ACCOUNT_ADD:
        case METADATA.ACCOUNT_LOADED: {
            const device = accountUtils.findAccountDevice(action.payload, api.getState().devices);
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

        default:
            break;
    }
    return action;
};

export default storageMiddleware;
