import { TRANSACTION, ACCOUNT } from '@wallet-actions/constants/index';

import { Dispatch, GetState } from '@suite-types/index';
import { db } from '@suite/storage';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import TrezorConnect, { AccountInfo } from 'trezor-connect';
import { getAccountTransactions } from '@suite/utils/wallet/reducerUtils';
import { Account } from '@wallet-types';

export type TransactionAction =
    | { type: typeof TRANSACTION.ADD; transactions: WalletAccountTransaction[] }
    | { type: typeof TRANSACTION.REMOVE; txId: string }
    | { type: typeof TRANSACTION.UPDATE; txId: string; timestamp: number }
    | { type: typeof TRANSACTION.FETCH_INIT }
    | {
          type: typeof TRANSACTION.FETCH_SUCCESS;
          account: Account;
          transactions: WalletAccountTransaction[];
      }
    | { type: typeof TRANSACTION.FETCH_ERROR; error: string };
// | { type: typeof TRANSACTION.FROM_STORAGE; transactions: WalletAccountTransaction[] };

// export const setTransactions = (transactions: WalletAccountTransaction[]) => ({
//     type: TRANSACTION.FROM_STORAGE,
//     transactions,
// });

// export const add = (transaction: WalletAccountTransaction) => async (
//     dispatch: Dispatch,
// ): Promise<void> => {
//     try {
//         await db.addItem('txs', transaction).then(_key => {
//             dispatch({
//                 type: TRANSACTION.ADD,
//                 transaction,
//             });
//         });
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
// };

// export const add = (transactions: WalletAccountTransaction) => async (
//     dispatch: Dispatch,
// ): Promise<void> => {
//     dispatch({
//         type: TRANSACTION.ADD,
//         transactions,
//     });
// };

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

const getTransactionsFromStorage = async (descriptor: string, offset?: number, count?: number) => {
    try {
        const txs = await db.getItemsExtended('txs', 'accountId-blockTime', {
            key: descriptor,
            offset,
            count,
        });
        return txs;
    } catch (error) {
        console.log(error);
        return null;
    }
};

export const fetchTransactions = (account: Account, page?: number, perPage?: number) => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<void> => {
    const offset = page && perPage ? (page - 1) * perPage : undefined;
    const count = perPage || undefined;
    let storedTxs = null;

    const { selectedAccount } = getState().wallet;
    // const totalTxs = selectedAccount.account!.history.total;
    const { transactions } = getState().wallet.transactions;
    const reducerTxs = getAccountTransactions(transactions, account);

    const txsForPage = reducerTxs.filter(t => t.page === page);
    // we already got txs for the page in reducer
    if (txsForPage.length > 0) return;
    // we already got all txs in reducer
    // if (totalTxs === reducerTxs.length) return;

    dispatch({
        type: TRANSACTION.FETCH_INIT,
    });

    storedTxs = await getTransactionsFromStorage(account.descriptor, offset, count);

    const shouldFetchFromBackend = storedTxs === null || storedTxs.length === 0;
    if (shouldFetchFromBackend) {
        let result = null;

        if (account.networkType === 'ripple') {
            const { marker } = selectedAccount.account!;
            result = await TrezorConnect.getAccountInfo({
                coin: selectedAccount.account!.symbol,
                descriptor: account.descriptor,
                details: 'txs',
                marker,
            });
        } else {
            result = await TrezorConnect.getAccountInfo({
                coin: getState().wallet.selectedAccount.account!.symbol,
                descriptor: account.descriptor,
                details: 'txs',
                page,
                pageSize: 25,
            });
        }

        if (result.success) {
            const updatedAccount = {
                ...account,
                ...result.payload,
                path: account.path, // preserve account path (fetched account comes without it)
                ...{ marker: result.payload.marker ? result.payload.marker : null },
            };
            dispatch({
                type: TRANSACTION.FETCH_SUCCESS,
                account: updatedAccount,
                transactions: result.payload.history.transactions || [],
            });

            dispatch({
                type: ACCOUNT.UPDATE,
                // immer.js used in reducer doesn't update fields that are set to undefined,
                // so when the backend returns undefined, we change it to null.
                payload: updatedAccount,
            });
        } else {
            dispatch({
                type: TRANSACTION.FETCH_ERROR,
                error: result.payload.error,
            });
        }
    } else {
        dispatch({
            type: TRANSACTION.FETCH_SUCCESS,
            transactions: storedTxs || [],
            account,
        });
    }
};
