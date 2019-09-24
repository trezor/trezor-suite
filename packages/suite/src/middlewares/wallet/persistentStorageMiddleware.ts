import { MiddlewareAPI } from 'redux';
// import * as TRANSACTION from '@wallet-actions/constants/transactionConstants';
import * as WALLET_SETTINGS from '@wallet-actions/constants/settingsConstants';
// import * as transactionActions from '@wallet-actions/transactionActions';
import { db } from '@suite/storage';
import { SUITE } from '@suite/actions/suite/constants';
import { AppState, Action as SuiteAction, Dispatch } from '@suite-types';
import { WalletAction } from '@wallet-types';
// import { ACCOUNT } from '@suite/actions/wallet/constants';
// import { AccountInfo } from 'trezor-connect';

const storageMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => async (
    action: SuiteAction | WalletAction,
): Promise<SuiteAction | WalletAction> => {
    // pass action
    next(action);

    switch (action.type) {
        // // Better solution for txs is to work directly with idb and trigger reducer update when needed.
        // // However this approach works nicely for settings, every change in settings reducer is reflected in idb.
        // case TRANSACTION.ADD: {
        //     console.log('adding to indexedDB');
        //     try {
        //         const txId = await db.addTransaction(action.transaction);
        //         console.log(txId);
        //     } catch (error) {
        //         if (error && error.name === 'ConstraintError') {
        //             console.log('Tx with such id already exists');
        //         } else if (error) {
        //             console.error(error.name);
        //             console.error(error.message);
        //         } else {
        //             console.error(error);
        //         }
        //     }

        //     // api.dispatch(transactionActions.add(action.transaction));
        //     break;
        // }
        // case TRANSACTION.REMOVE:
        //     console.log('removing tx from indexedDB');
        //     // https://stackoverflow.com/a/55321144
        //     // https://stackoverflow.com/a/57102280
        //     // @ts-ignore
        //     // api.dispatch(transactionActions.remove(action.txId));
        //     db.removeTransaction(action.txId);
        //     break;
        // case TRANSACTION.UPDATE:
        //     console.log('updating tx in indexedDB');
        //     // https://stackoverflow.com/a/55321144
        //     // https://stackoverflow.com/a/57102280
        //     // @ts-ignore
        //     db.updateTransaction(action.txId, action.timestamp);
        //     break;

        /*
        TODO: only if device is remembered
        case ACCOUNT.CREATE: {
            const account: AccountInfo = action.payload;
            const { transactions } = account.history;
            if (transactions) {
                transactions.forEach(async tx => {
                    try {
                        await db.addItem('txs', {
                            ...tx,
                            accountId: account.descriptor,
                        });
                    } catch (error) {
                        if (error && error.name === 'ConstraintError') {
                            console.log('Tx with such id already exists');
                        } else if (error) {
                            console.error(error.name);
                            console.error(error.message);
                        } else {
                            console.error(error);
                        }
                    }
                });
            }

            // api.dispatch(transactionActions.add(action.transaction));
            break;
        }
        */

        case WALLET_SETTINGS.CHANGE_NETWORKS:
        case WALLET_SETTINGS.CHANGE_EXTERNAL_NETWORKS:
        case WALLET_SETTINGS.SET_HIDE_BALANCE:
        case WALLET_SETTINGS.SET_LOCAL_CURRENCY:
            db.addItem(
                'walletSettings',
                {
                    ...api.getState().wallet.settings,
                },
                'wallet',
            );
            break;

        case SUITE.SET_LANGUAGE:
        case SUITE.INITIAL_RUN_COMPLETED: {
            const { suite } = api.getState();
            db.addItem(
                'suiteSettings',
                {
                    language: suite.language,
                    initialRun: suite.initialRun,
                },
                'suite',
            );
            break;
        }
        default:
            break;
    }
    return action;
};

export default storageMiddleware;
