import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from '@suite-types/index';
import * as TRANSACTION from '@wallet-actions/constants/transactionConstants';
import * as WALLET_SETTINGS from '@wallet-actions/constants/settingsConstants';
// import * as transactionActions from '@wallet-actions/transactionActions';
import * as db from '@suite/storage/index';

const storageMiddleware = (_api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => async (
    action: Action,
): Promise<Action> => {
    // pass action
    next(action);

    // perhaps we don't need middleware just for syncing reducer to idb.
    // maybe a better solution would be to work directly with idb and trigger reducer update when needed
    switch (action.type) {
        case TRANSACTION.ADD: {
            console.log('adding to indexedDB');
            try {
                const txId = await db.addTransaction(action.transaction);
                console.log(txId);
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

            // api.dispatch(transactionActions.add(action.transaction));
            break;
        }
        case TRANSACTION.REMOVE:
            console.log('removing tx from indexedDB');
            // https://stackoverflow.com/a/55321144
            // https://stackoverflow.com/a/57102280
            // @ts-ignore
            // api.dispatch(transactionActions.remove(action.txId));
            db.removeTransaction(action.txId);
            break;
        case TRANSACTION.UPDATE:
            console.log('updating tx in indexedDB');
            // https://stackoverflow.com/a/55321144
            // https://stackoverflow.com/a/57102280
            // @ts-ignore
            db.updateTransaction(action.txId, action.timestamp);
            break;

        case WALLET_SETTINGS.SET_HIDDEN_COINS:
        case WALLET_SETTINGS.SET_HIDDEN_COINS_EXTERNAL:
        case WALLET_SETTINGS.SET_HIDE_BALANCE:
        case WALLET_SETTINGS.SET_LOCAL_CURRENCY:
            db.saveWalletSettings(_api.getState().wallet.settings);
            break;

        default:
            break;
    }
    return action;
};

export default storageMiddleware;
