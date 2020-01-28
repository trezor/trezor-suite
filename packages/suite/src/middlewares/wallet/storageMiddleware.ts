import { MiddlewareAPI } from 'redux';
// import * as TRANSACTION from '@wallet-actions/constants/transactionConstants';
import * as WALLET_SETTINGS from '@suite/actions/settings/constants/walletSettings';
// import * as transactionActions from '@wallet-actions/transactionActions';
import * as storageActions from '@suite-actions/storageActions';
import * as accountUtils from '@wallet-utils/accountUtils';
import { SUITE } from '@suite-actions/constants';
import { AppState, Action as SuiteAction, Dispatch } from '@suite-types';
import { WalletAction } from '@wallet-types';
import { ACCOUNT, DISCOVERY, TRANSACTION } from '@wallet-actions/constants';
import { getDiscoveryForDevice } from '@wallet-actions/discoveryActions';
import { isDeviceRemembered } from '@suite-utils/device';
import { serializeDiscovery } from '@suite-utils/storage';

const storageMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => async (
    action: SuiteAction | WalletAction,
): Promise<SuiteAction | WalletAction> => {
    // @ts-ignore
    const prevState = api.getState();
    // pass action
    next(action);

    switch (action.type) {
        case SUITE.REMEMBER_DEVICE:
            api.dispatch(storageActions.rememberDevice(action.payload));
            break;

        case SUITE.FORGET_DEVICE:
            api.dispatch(storageActions.forgetDevice(action.payload));
            break;

        case SUITE.FORGET_DEVICE_INSTANCE:
            api.dispatch(storageActions.forgetDeviceInstance(action.payload));
            break;

        case ACCOUNT.CREATE:
        case ACCOUNT.UPDATE: {
            const device = accountUtils.getAccountDevice(api.getState().devices, action.payload);
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
            });
            break;
        }

        case TRANSACTION.ADD:
        case TRANSACTION.FETCH_SUCCESS: {
            const device = accountUtils.getAccountDevice(api.getState().devices, action.account);
            // update only transactions for remembered device
            if (isDeviceRemembered(device)) {
                storageActions.removeAccountTransactions(action.account);
                api.dispatch(storageActions.saveAccountTransactions(action.account));
            }
            break;
        }

        case TRANSACTION.REMOVE:
            storageActions.removeAccountTransactions(action.account);
            break;

        case DISCOVERY.UPDATE:
        case DISCOVERY.INTERRUPT:
        case DISCOVERY.STOP:
        case DISCOVERY.COMPLETE: {
            const { device } = api.getState().suite;
            // update only discovery for remembered device
            if (isDeviceRemembered(device)) {
                const discovery = api.dispatch(getDiscoveryForDevice());
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
        case WALLET_SETTINGS.CHANGE_EXTERNAL_NETWORKS:
        case WALLET_SETTINGS.SET_HIDE_BALANCE:
        case WALLET_SETTINGS.SET_LOCAL_CURRENCY:
            api.dispatch(storageActions.saveWalletSettings());
            break;

        case SUITE.SET_LANGUAGE:
        case SUITE.INITIAL_RUN_COMPLETED:
            api.dispatch(storageActions.saveSuiteSettings());
            break;
        default:
            break;
    }
    return action;
};

export default storageMiddleware;
