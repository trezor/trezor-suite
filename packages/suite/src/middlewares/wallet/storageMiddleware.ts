import { MiddlewareAPI } from 'redux';
// import * as TRANSACTION from '@wallet-actions/constants/transactionConstants';
import * as WALLET_SETTINGS from '@wallet-actions/constants/settingsConstants';
// import * as transactionActions from '@wallet-actions/transactionActions';
import * as storageActions from '@suite-actions/storageActions';
import * as accountUtils from '@wallet-utils/accountUtils';
import { SUITE } from '@suite-actions/constants';
import { AppState, Action as SuiteAction, Dispatch } from '@suite-types';
import { WalletAction } from '@wallet-types';
import { ACCOUNT, DISCOVERY, TRANSACTION } from '@wallet-actions/constants';
// import { ACCOUNT } from '@suite/actions/wallet/constants';
// import { AccountInfo } from 'trezor-connect';

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

        case ACCOUNT.CREATE:
        case ACCOUNT.UPDATE: {
            // TODO: explore better way to update accounts only
            const device = accountUtils.getAccountDevice(api.getState().devices, action.payload);
            if (device && device.features && device.remember) {
                api.dispatch(storageActions.rememberDevice(device));
            }
            break;
        }

        case TRANSACTION.ADD:
        case TRANSACTION.FETCH_SUCCESS: {
            // TODO: explore better way to update accounts only
            const device = accountUtils.getAccountDevice(api.getState().devices, action.account);
            if (device && device.features && device.remember) {
                api.dispatch(storageActions.rememberDevice(device));
            }
            break;
        }

        case DISCOVERY.UPDATE:
        case DISCOVERY.INTERRUPT:
        case DISCOVERY.STOP:
        case DISCOVERY.COMPLETE: {
            // TODO: explore better way to update discovery only
            const device = api.getState().devices.find(d => d.state === action.payload.deviceState);
            if (device && device.features && device.remember) {
                api.dispatch(storageActions.rememberDevice(device));
            }
            break;
        }

        case SUITE.FORGET_DEVICE:
            api.dispatch(storageActions.forgetDevice(action.payload));
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
