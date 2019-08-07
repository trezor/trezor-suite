import { TRANSACTION } from '@wallet-actions/constants/index';

import { Dispatch } from '@suite-types/index';
import { WalletTransaction } from '@suite/storage/types';
import * as db from '@suite/storage';

export type TransactionAction =
    | { type: typeof TRANSACTION.ADD; transaction: WalletTransaction }
    | { type: typeof TRANSACTION.REMOVE; txId: string }
    | { type: typeof TRANSACTION.UPDATE; txId: string; timestamp: number }
    | { type: typeof TRANSACTION.FROM_STORAGE; transactions: WalletTransaction[] };

export const setTransactions = (transactions: WalletTransaction[]) => ({
    type: TRANSACTION.FROM_STORAGE,
    transactions,
});

export const add = (transaction: WalletTransaction) => async (
    dispatch: Dispatch,
): Promise<void> => {
    try {
        await db.addTransaction(transaction).then(_key => {
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
    db.removeTransaction(txId).then(() => {
        dispatch({
            type: TRANSACTION.REMOVE,
            txId,
        });
    });
};

export const update = (txId: string) => async (dispatch: Dispatch) => {
    const updatedTimestamp = Date.now();
    db.updateTransaction(txId, updatedTimestamp).then(_key => {
        dispatch({
            type: TRANSACTION.UPDATE,
            txId,
            timestamp: updatedTimestamp,
        });
    });
};

export const getFromStorage = (accountId: number, from?: number, to?: number) => async (
    dispatch: Dispatch,
): Promise<void> => {
    db.getTransactions(accountId, from, to).then(transactions => {
        dispatch({
            type: TRANSACTION.FROM_STORAGE,
            transactions,
        });
    });
};
