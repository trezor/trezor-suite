import { MiddlewareAPI } from 'redux';
// import * as TRANSACTION from '@wallet-actions/constants/transactionConstants';
import * as WALLET_SETTINGS from '@wallet-actions/constants/settingsConstants';
// import * as transactionActions from '@wallet-actions/transactionActions';
import * as storageActions from '@suite-actions/storageActions';
import { SUITE } from '@suite/actions/suite/constants';
import { AppState, Action as SuiteAction, Dispatch } from '@suite-types';
import { WalletAction } from '@wallet-types';
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
        // case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
        //     if (
        //         action.payload.account &&
        //         prevState.wallet.selectedAccount.account !== action.payload.account
        //     ) {
        //         api.dispatch(
        //             transactionActions.fetchTransactions(action.payload.account.descriptor, 1, 25),
        //         );
        //     }
        //     break;

        /*
        TODO: only if device is remembered
        case ACCOUNT.CREATE: {
            // const account: AccountInfo = action.payload;
            // const { transactions } = account.history;
            // if (transactions) {
            //     transactions.forEach(async tx => {
            //         try {
            //             await db.addItem('txs', {
            //                 ...tx,
            //                 accountId: account.descriptor,
            //             });
            //         } catch (error) {
            //             if (error && error.name === 'ConstraintError') {
            //                 console.log('Tx with such id already exists');
            //             } else if (error) {
            //                 console.error(error.name);
            //                 console.error(error.message);
            //             } else {
            //                 console.error(error);
            //             }
            //         }
            //     });
            // }

            break;
        }
        */

        case SUITE.REMEMBER_DEVICE:
            api.dispatch(storageActions.rememberDevice(action.payload));
            break;

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
