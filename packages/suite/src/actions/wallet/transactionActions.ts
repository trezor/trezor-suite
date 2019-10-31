import TrezorConnect, { AccountTransaction } from 'trezor-connect';
import { getAccountTransactions } from '@wallet-utils/accountUtils';
import * as accountActions from '@wallet-actions/accountActions';
import { TRANSACTION } from '@wallet-actions/constants';
// import { db } from '@suite/storage';
// import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { SETTINGS } from '@suite-config';
import { Account } from '@wallet-types';
import { Dispatch, GetState } from '@suite-types';

export type TransactionAction =
    | {
          type: typeof TRANSACTION.ADD;
          transactions: AccountTransaction[];
          account: Account;
          page?: number;
      }
    | { type: typeof TRANSACTION.REMOVE; account: Account }
    | { type: typeof TRANSACTION.UPDATE; txId: string; timestamp: number }
    | { type: typeof TRANSACTION.FETCH_INIT }
    | {
          type: typeof TRANSACTION.FETCH_SUCCESS;
          transactions: AccountTransaction[];
          account: Account;
          page: number;
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

export const add = (transactions: AccountTransaction[], account: Account, page?: number) => async (
    dispatch: Dispatch,
) => {
    dispatch({
        type: TRANSACTION.ADD,
        transactions,
        account,
        page,
    });
};
/**
 * Remove all transactions for a given account
 *
 * @param {Account} account
 */
export const remove = (account: Account) => async (dispatch: Dispatch) => {
    dispatch({
        type: TRANSACTION.REMOVE,
        account,
    });
};

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

// const getTransactionsFromStorage = async (descriptor: string, offset?: number, count?: number) => {
//     try {
//         const txs = await db.getItemsExtended('txs', 'accountId-blockTime', {
//             key: descriptor,
//             offset,
//             count,
//         });
//         return txs;
//     } catch (error) {
//         console.log(error);
//         return null;
//     }
// };

export const fetchTransactions = (account: Account, page: number, perPage?: number) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { selectedAccount } = getState().wallet;
    // const totalTxs = selectedAccount.account!.history.total;
    const { transactions } = getState().wallet.transactions;
    const reducerTxs = getAccountTransactions(transactions, account);

    const startIndex = (page - 1) * (perPage || SETTINGS.TXS_PER_PAGE);
    const stopIndex = startIndex + (perPage || SETTINGS.TXS_PER_PAGE);
    const txsForPage = reducerTxs.slice(startIndex, stopIndex);

    // we already got txs for the page in reducer
    if (txsForPage.length > 0) return;

    dispatch({
        type: TRANSACTION.FETCH_INIT,
    });

    // TODO: storing and fetching from the db
    // const offset = page && perPage ? (page - 1) * perPage : undefined;
    // const count = perPage || undefined;
    // const storedTxs = await getTransactionsFromStorage(account.descriptor, offset, count);

    // const shouldFetchFromBackend = storedTxs === null || storedTxs.length === 0;
    const shouldFetchFromBackend = true;
    if (shouldFetchFromBackend) {
        const { marker } = selectedAccount.account!;
        const result = await TrezorConnect.getAccountInfo({
            coin: selectedAccount.account!.symbol,
            descriptor: account.descriptor,
            details: 'txs',
            page, // useful for every network except ripple
            pageSize: SETTINGS.TXS_PER_PAGE,
            ...(marker ? { marker } : {}), // set marker only if it is not undefined (ripple), otherwise it fails on marker validation
        });

        if (result && result.success) {
            const updatedAccount = accountActions.update(account, result.payload).payload;
            // TODO
            // @ts-ignore
            dispatch({
                type: TRANSACTION.FETCH_SUCCESS,
                account: updatedAccount,
                transactions: result.payload.history.transactions || [],
                page,
            });
            // updates the marker/page object for the account
            dispatch(accountActions.update(account, result.payload));
        } else {
            dispatch({
                type: TRANSACTION.FETCH_ERROR,
                error: result ? result.payload.error : 'unknown error',
            });
        }
    } // else {
    //     dispatch({
    //         type: TRANSACTION.FETCH_SUCCESS,
    //         transactions: storedTxs || [],
    //         account,
    //         page,
    //     });
    // }
};
