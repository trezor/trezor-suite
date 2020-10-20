import TrezorConnect, { AccountTransaction } from 'trezor-connect';
import { getAccountTransactions } from '@wallet-utils/accountUtils';
import * as accountActions from '@wallet-actions/accountActions';
import { TRANSACTION } from '@wallet-actions/constants';
import { SETTINGS } from '@suite-config';
import { Account, WalletAccountTransaction } from '@wallet-types';
import { Dispatch, GetState } from '@suite-types';

export type TransactionAction =
    | {
          type: typeof TRANSACTION.ADD;
          transactions: AccountTransaction[];
          account: Account;
          page?: number;
      }
    | { type: typeof TRANSACTION.REMOVE; account: Account; txs: WalletAccountTransaction[] }
    | { type: typeof TRANSACTION.RESET; account: Account }
    | { type: typeof TRANSACTION.UPDATE; txId: string; timestamp: number }
    | { type: typeof TRANSACTION.FETCH_INIT }
    | {
          type: typeof TRANSACTION.FETCH_SUCCESS;
      }
    | { type: typeof TRANSACTION.FETCH_ERROR; error: string };

export const add = (
    transactions: AccountTransaction[],
    account: Account,
    page?: number,
): TransactionAction => ({
    type: TRANSACTION.ADD,
    transactions,
    account,
    page,
});

/**
 * Remove all transactions for a given account
 *
 * @param {Account} account
 */
export const reset = (account: Account): TransactionAction => ({
    type: TRANSACTION.RESET,
    account,
});

/**
 * Remove certain transactions for a given account
 *
 * @param {Account} account
 */
export const remove = (account: Account, txs: WalletAccountTransaction[]): TransactionAction => ({
    type: TRANSACTION.REMOVE,
    account,
    txs,
});

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

export const fetchTransactions = (account: Account, page: number, perPage?: number) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { transactions } = getState().wallet.transactions;
    const reducerTxs = getAccountTransactions(transactions, account);

    const startIndex = (page - 1) * (perPage || SETTINGS.TXS_PER_PAGE);
    const stopIndex = startIndex + (perPage || SETTINGS.TXS_PER_PAGE);
    const txsForPage = reducerTxs.slice(startIndex, stopIndex).filter(tx => !!tx.txid); // filter out "empty" values

    // we already got txs for the page in reducer
    if (txsForPage.length === SETTINGS.TXS_PER_PAGE) return;

    dispatch({
        type: TRANSACTION.FETCH_INIT,
    });

    const { marker } = account;
    const result = await TrezorConnect.getAccountInfo({
        coin: account.symbol,
        descriptor: account.descriptor,
        details: 'txs',
        page, // useful for every network except ripple
        pageSize: SETTINGS.TXS_PER_PAGE,
        ...(marker ? { marker } : {}), // set marker only if it is not undefined (ripple), otherwise it fails on marker validation
    });

    if (result && result.success) {
        const updatedAccount = accountActions.update(account, result.payload).payload as Account;
        dispatch({
            type: TRANSACTION.FETCH_SUCCESS,
        });
        dispatch({
            type: TRANSACTION.ADD,
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
};
