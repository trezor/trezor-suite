import { TRANSACTION, ACCOUNT } from '@wallet-actions/constants/index';

import { Dispatch, GetState } from '@suite-types/index';
import { db } from '@suite/storage';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import TrezorConnect from 'trezor-connect';
import { Account } from '@wallet-types';

export type TransactionAction =
    | { type: typeof TRANSACTION.ADD; transactions: WalletAccountTransaction[] }
    | { type: typeof TRANSACTION.REMOVE; txId: string }
    | { type: typeof TRANSACTION.UPDATE; txId: string; timestamp: number }
    | { type: typeof TRANSACTION.FETCH_INIT }
    | {
          type: typeof TRANSACTION.FETCH_SUCCESS;
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

export const add = (transactions: WalletAccountTransaction) => async (
    dispatch: Dispatch,
): Promise<void> => {
    dispatch({
        type: TRANSACTION.ADD,
        transactions,
    });
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

export const getAccountTransactions = (descriptor: string) => (
    _dispatch: Dispatch,
    getState: GetState,
): WalletAccountTransaction[] => {
    const { selectedAccount } = getState().wallet;
    const transactions = getState().wallet.transactions.transactions.filter(
        t => t.accountDescriptor === descriptor,
    );
    return transactions;
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
    const totalTxs = selectedAccount.account!.history.total;
    const reducerTxs = dispatch(getAccountTransactions(account.descriptor));

    console.log('descriptor', account.descriptor);
    console.log('page', page);

    const txsForPage = reducerTxs.filter(t => t.page === page);
    // we already got txs for the page in reducer
    if (txsForPage.length > 0) return;
    // we already got all txs in reducer
    // if (totalTxs === reducerTxs.length) return;

    dispatch({
        type: TRANSACTION.FETCH_INIT,
    });

    console.log('offset', offset);
    console.log('count', count);
    storedTxs = await getTransactionsFromStorage(account.descriptor, offset, count);

    if (storedTxs) {
        console.log('stored txs length', storedTxs.length);
    } else {
        console.log('no stored txs for the acc', account.descriptor);
    }

    const shouldFetchFromBackend =
        storedTxs === null || storedTxs.length === 0 || storedTxs.length < perPage;
    if (shouldFetchFromBackend) {
        console.log('networkType', account.networkType);
        console.log('fetching page', page);
        let result = null;

        if (account.networkType === 'ripple') {
            const { marker } = selectedAccount.account!;
            result = await TrezorConnect.getAccountInfo({
                coin: selectedAccount!.account!.network,
                descriptor: account.descriptor,
                details: 'txs',
                marker,
            });
            console.log('req marker', marker);
        } else {
            result = await TrezorConnect.getAccountInfo({
                coin: getState().wallet.selectedAccount!.account!.network,
                descriptor: account.descriptor,
                details: 'txs',
                page,
                pageSize: 25,
            });
        }

        if (result.success) {
            console.log('fetched from the blockbook:');
            console.log('marker', result.payload.marker);
            console.log('fetched accountINfo', result.payload);
            console.log(result.payload.history.transactions);
            dispatch({
                type: TRANSACTION.FETCH_SUCCESS,
                transactions: (result.payload.history.transactions || []).map(tx => ({
                    ...tx,
                    page,
                    accountDescriptor: account.descriptor,
                })),
            });
            dispatch({
                type: ACCOUNT.UPDATE,
                payload: { ...account, ...result.payload },
            });
            console.log('res marker', result.payload.marker ? result.payload.marker : undefined);
        } else {
            dispatch({
                type: TRANSACTION.FETCH_ERROR,
                error: result.payload.error,
            });
        }
    } else {
        dispatch({
            type: TRANSACTION.FETCH_SUCCESS,
            transactions: storedTxs
                ? storedTxs.map(t => ({ ...t, accountId: account.descriptor }))
                : [],
        });
    }
};
