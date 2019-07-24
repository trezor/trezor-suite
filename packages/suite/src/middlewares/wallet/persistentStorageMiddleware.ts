import { MiddlewareAPI } from 'redux';
import { AppState, Action, Dispatch } from '@suite-types/index';
import * as TRANSACTION from '@wallet-actions/constants/transactionConstants';
// import * as transactionActions from '@wallet-actions/transactionActions';
import * as db from '@suite/storage/index';

const storageMiddleware = (_api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    // perhaps we don't need middleware just for syncing reducer to idb.
    // maybe a better solution would be to work directly with idb and trigger reducer update when needed
    switch (action.type) {
        case TRANSACTION.ADD:
            console.log('adding to indexedDB');
            try {
                db.addTransaction(action.transaction)
                    .then(() => {
                        console.log('doneee');
                    })
                    .catch(error => {
                        console.log('omg');
                        console.error(error);
                    });
            } catch (error) {
                console.log('kačujem');
                console.log(error);
            }
            // api.dispatch(transactionActions.add(action.transaction));
            break;
        case TRANSACTION.REMOVE:
            console.log('removing tx from indexedDB');
            // https://stackoverflow.com/a/55321144
            // https://stackoverflow.com/a/57102280
            // @ts-ignore
            // api.dispatch(transactionActions.remove(action.txId));
            db.removeTransaction(action.txId);
            break;
        default:
            break;
    }
    return action;
};

export default storageMiddleware;
