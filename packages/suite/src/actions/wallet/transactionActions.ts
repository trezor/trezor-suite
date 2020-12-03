import TrezorConnect, { AccountTransaction, PrecomposedTransaction } from 'trezor-connect';
import {
    getAccountTransactions,
    formatNetworkAmount,
    getRbfPendingAccount,
} from '@wallet-utils/accountUtils';
import { findTransactions } from '@wallet-utils/transactionUtils';
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
    | {
          type: typeof TRANSACTION.REPLACE;
          key: string;
          txid: string;
          tx: WalletAccountTransaction;
      }
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
 * @param {WalletAccountTransaction[]} txs
 */
export const remove = (account: Account, txs: WalletAccountTransaction[]): TransactionAction => ({
    type: TRANSACTION.REMOVE,
    account,
    txs,
});

export const replaceTransaction = (
    account: Account,
    tx: PrecomposedTransaction,
    prevTxid: string,
    newTxid: string,
    rbf?: boolean,
) => (dispatch: Dispatch, getState: GetState) => {
    if (tx.type !== 'final') return;

    // find all transactions to replace, they may be related to another account
    const transactions = findTransactions(prevTxid, getState().wallet.transactions.transactions);
    const newFee = formatNetworkAmount(tx.fee, account.symbol);
    const newBaseFee = parseInt(tx.fee, 10);
    let feeDifference = 0;

    // prepare replace actions for txs
    const actions = transactions.map(t => {
        const action = {
            type: TRANSACTION.REPLACE,
            key: t.key,
            txid: prevTxid,
            tx: {
                ...t.tx,
                txid: newTxid,
                fee: newFee,
                rbf: !!rbf,
                // TODO: details: {}, is it worth it?
            },
        };
        // finalized and recv tx shouldn't have rbfParams
        if (!rbf || t.tx.type === 'recv') {
            delete action.tx.rbfParams;
            return action;
        }

        if (action.tx.type === 'self') {
            action.tx.amount = newFee;
        }
        // update tx rbfParams
        if (action.tx.rbfParams) {
            // balance is reduced only by fee differences
            feeDifference = newBaseFee - action.tx.rbfParams.baseFee;
            action.tx.rbfParams = {
                ...action.tx.rbfParams,
                baseFee: newBaseFee,
                feeRate: tx.feePerByte,
            };
        }
        return action;
    });
    // dispatch replace actions
    actions.forEach(a => dispatch(a));

    // calculate new account balance and utxo
    const newAccount = getRbfPendingAccount(account, tx, prevTxid, newTxid, feeDifference);
    if (newAccount) {
        dispatch(accountActions.updateAccount(newAccount));
    }
};

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
