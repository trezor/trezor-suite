import { TRANSACTION } from '@wallet-actions/constants/index';

import { Dispatch } from '@suite-types/index';
import { db } from '@suite/storage';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';

export type TransactionAction =
    | { type: typeof TRANSACTION.ADD; transaction: WalletAccountTransaction }
    | { type: typeof TRANSACTION.REMOVE; txId: string }
    | { type: typeof TRANSACTION.UPDATE; txId: string; timestamp: number }
    | { type: typeof TRANSACTION.FETCH_INIT }
    | { type: typeof TRANSACTION.FETCH_SUCCESS; transactions: WalletAccountTransaction[] }
    | { type: typeof TRANSACTION.FETCH_ERROR; error: string };
// | { type: typeof TRANSACTION.FROM_STORAGE; transactions: WalletAccountTransaction[] };

// export const setTransactions = (transactions: WalletAccountTransaction[]) => ({
//     type: TRANSACTION.FROM_STORAGE,
//     transactions,
// });

export const add = (transaction: WalletAccountTransaction) => async (
    dispatch: Dispatch,
): Promise<void> => {
    try {
        await db.addItem('txs', transaction).then(_key => {
            dispatch({
                type: TRANSACTION.ADD,
                transaction,
            });
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
};

export const remove = (txId: string) => async (dispatch: Dispatch) => {
    db.removeItem('txs', 'txId', txId).then(() => {
        dispatch({
            type: TRANSACTION.REMOVE,
            txId,
        });
    });
};

export const update = (txId: string) => async (dispatch: Dispatch) => {
    const updatedTimestamp = Date.now();
    db.updateItemByIndex('txs', 'txId', txId, { timestamp: updatedTimestamp }).then(_key => {
        dispatch({
            type: TRANSACTION.UPDATE,
            txId,
            timestamp: updatedTimestamp,
        });
    });
};

export const fetchFromStorage = (accountId: string, offset?: number, count?: number) => async (
    dispatch: Dispatch,
): Promise<void> => {
    dispatch({
        type: TRANSACTION.FETCH_INIT,
    });

    // TODO: check if everything is already stored in db, fetch from blockbook when necessary
    db.getItemsExtended('txs', 'accountId-blockTime', {
        key: accountId,
        offset,
        count,
    })
        .then((transactions: WalletAccountTransaction[]) => {
            dispatch({
                type: TRANSACTION.FETCH_SUCCESS,
                transactions,
            });
        })
        .catch(error => {
            dispatch({
                type: TRANSACTION.FETCH_ERROR,
                error,
            });
        });
};
