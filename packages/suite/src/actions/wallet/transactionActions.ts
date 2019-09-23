import TrezorConnect, { ResponseMessage, AccountInfo, AccountTransaction } from 'trezor-connect';
import { getAccountTransactions } from '@suite/utils/wallet/reducerUtils';
import * as accountActions from '@wallet-actions/accountActions';
import { SETTINGS } from '@suite/config/suite';
import { TRANSACTION } from '@wallet-actions/constants';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { db } from '@suite/storage';
import { Account } from '@wallet-types';
import { Dispatch, GetState } from '@suite-types';

export type TransactionAction =
    | { type: typeof TRANSACTION.ADD; transactions: WalletAccountTransaction[] }
    | { type: typeof TRANSACTION.REMOVE; txId: string }
    | { type: typeof TRANSACTION.UPDATE; txId: string; timestamp: number }
    | { type: typeof TRANSACTION.FETCH_INIT }
    | {
          type: typeof TRANSACTION.FETCH_SUCCESS;
          transactions: AccountTransaction[];
          account: Account;
          page?: number;
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

// export const remove = (txId: string) => async (dispatch: Dispatch) => {
//         db.removeItem('txs', 'txId', txId).then(() => {
//         dispatch({
//             type: TRANSACTION.REMOVE,
//             txId,
//         });
//     });
// };

// export const update = (txId: string) => async (dispatch: Dispatch) => {
//     const updatedTimestamp = Date.now();
//     db.updateItemByIndex('txs', 'txId', txId, { timestamp: updatedTimestamp }).then(_key => {
//         dispatch({
//             type: TRANSACTION.UPDATE,
//             txId,
//             timestamp: updatedTimestamp,
//         });
//     });
// };

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
) => {
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

    dispatch({
        type: TRANSACTION.FETCH_INIT,
    });

    storedTxs = await getTransactionsFromStorage(account.descriptor, offset, count);

    const shouldFetchFromBackend = storedTxs === null || storedTxs.length === 0;
    if (shouldFetchFromBackend) {
        let result: ResponseMessage<AccountInfo> | null = null;

        if (account.networkType === 'ripple') {
            const marker = selectedAccount.account!.marker || undefined;
            result = await TrezorConnect.getAccountInfo({
                coin: selectedAccount.account!.symbol,
                descriptor: account.descriptor,
                details: 'txs',
                marker,
            });
        } else {
            result = await TrezorConnect.getAccountInfo({
                coin: selectedAccount.account!.symbol,
                descriptor: account.descriptor,
                details: 'txs',
                page,
                pageSize: SETTINGS.TXS_PER_PAGE,
            });
        }

        if (result && result.success) {
            const updatedAccount = accountActions.update(account, result.payload).payload;

            dispatch({
                type: TRANSACTION.FETCH_SUCCESS,
                account: updatedAccount,
                transactions: result.payload.history.transactions || [],
                page,
            });

            dispatch(accountActions.update(account, result.payload));
        } else {
            dispatch({
                type: TRANSACTION.FETCH_ERROR,
                error: result ? result.payload.error : 'unknown error',
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
