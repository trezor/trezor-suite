import TrezorConnect, { AccountTransaction } from 'trezor-connect';
import { saveAs } from 'file-saver';
import { getAccountTransactions, formatNetworkAmount } from '@wallet-utils/accountUtils';
import { enhanceTransaction, findTransactions } from '@wallet-utils/transactionUtils';
import * as accountActions from '@wallet-actions/accountActions';
import { TRANSACTION } from '@wallet-actions/constants';
import { SETTINGS } from '@suite-config';
import { Account, WalletAccountTransaction } from '@wallet-types';
import { Dispatch, GetState } from '@suite-types';
import { PrecomposedTransactionFinal } from '@wallet-types/sendForm';
import { formatData } from '@wallet-utils/exportTransactions';

export type TransactionAction =
    | {
          type: typeof TRANSACTION.ADD;
          transactions: WalletAccountTransaction[];
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
    transactions: transactions.map(tx => enhanceTransaction(tx, account)),
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

/**
 * Replace existing transaction in the reducer.
 * There might be multiple occurrences of the same transaction assigned to multiple accounts in the storage:
 * sender account and receiver account(s)
 *
 * @param {Account} account
 * @param {PrecomposedTransactionFinal} tx
 * @param {string} newTxid
 */
export const replaceTransaction =
    (account: Account, tx: PrecomposedTransactionFinal, newTxid: string) =>
    (dispatch: Dispatch, getState: GetState) => {
        if (!tx.prevTxid) return; // ignore if it's not replacement tx

        // find all transactions to replace, they may be related to another account
        const transactions = findTransactions(
            tx.prevTxid,
            getState().wallet.transactions.transactions,
        );
        const newFee = formatNetworkAmount(tx.fee, account.symbol);
        const newBaseFee = parseInt(tx.fee, 10);

        // prepare replace actions for txs
        const actions = transactions.map(t => {
            const action = {
                type: TRANSACTION.REPLACE,
                key: t.key,
                txid: tx.prevTxid,
                tx: {
                    ...t.tx,
                    txid: newTxid,
                    fee: newFee,
                    rbf: !!tx.rbf,
                    blockTime: Math.round(new Date().getTime() / 1000),
                    // TODO: details: {}, is it worth it?
                },
            };
            // finalized and recv tx shouldn't have rbfParams
            if (!tx.rbf || t.tx.type === 'recv') {
                delete action.tx.rbfParams;
                return action;
            }

            if (action.tx.type === 'self') {
                action.tx.amount = newFee;
            }
            // update tx rbfParams
            if (action.tx.rbfParams) {
                action.tx.rbfParams = {
                    ...action.tx.rbfParams,
                    txid: newTxid,
                    baseFee: newBaseFee,
                    feeRate: tx.feePerByte,
                };
            }
            return action;
        });
        // dispatch replace actions
        actions.forEach(a => dispatch(a));
    };

export const fetchTransactions =
    (account: Account, page: number, perPage?: number, noLoading = false, recursive = false) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { transactions } = getState().wallet.transactions;
        const reducerTxs = getAccountTransactions(transactions, account);

        const startIndex = (page - 1) * (perPage || SETTINGS.TXS_PER_PAGE);
        const stopIndex = startIndex + (perPage || SETTINGS.TXS_PER_PAGE);
        const txsForPage = reducerTxs.slice(startIndex, stopIndex).filter(tx => !!tx.txid); // filter out "empty" values

        // we already got txs for the page in reducer
        if (
            (page > 1 && txsForPage.length === perPage) ||
            txsForPage.length === account.history.total
        ) {
            if (recursive) {
                await dispatch(fetchTransactions(account, page + 1, perPage, noLoading, true));
            }

            return;
        }

        if (!noLoading) {
            dispatch({
                type: TRANSACTION.FETCH_INIT,
            });
        }

        const { marker } = account;
        const result = await TrezorConnect.getAccountInfo({
            coin: account.symbol,
            descriptor: account.descriptor,
            details: 'txs',
            page, // useful for every network except ripple
            pageSize: perPage,
            ...(marker ? { marker } : {}), // set marker only if it is not undefined (ripple), otherwise it fails on marker validation
        });

        if (result && result.success) {
            const updatedAccount = accountActions.update(account, result.payload)
                .payload as Account;
            const transactions = result.payload.history.transactions || [];
            dispatch({
                type: TRANSACTION.FETCH_SUCCESS,
            });
            dispatch(add(transactions, updatedAccount, page));
            // updates the marker/page object for the account
            dispatch(accountActions.update(account, result.payload));

            if (recursive && transactions.length === (perPage || SETTINGS.TXS_PER_PAGE)) {
                await dispatch(
                    fetchTransactions(updatedAccount, page + 1, perPage, noLoading, true),
                );
            }
        } else {
            dispatch({
                type: TRANSACTION.FETCH_ERROR,
                error: result ? result.payload.error : 'unknown error',
            });
        }
    };

export const exportTransactions =
    (account: Account, accountName: string, type: 'csv' | 'pdf' | 'json') =>
    async (_: Dispatch, getState: GetState) => {
        // Get state of transactions
        const transactions = getAccountTransactions(
            getState().wallet.transactions.transactions,
            account,
            // add metadata directly to transactions
        ).map(transaction => ({
            ...transaction,
            targets: transaction.targets.map((target, index) => ({
                ...target,
                metadataLabel: account.metadata?.outputLabels?.[transaction.txid]?.[index],
            })),
        }));

        // Prepare data in right format
        const data = await formatData({
            coin: account.symbol,
            accountName,
            type,
            transactions,
        });

        // Save file
        saveAs(data, `export-${account.symbol}-${+new Date()}.${type}`);
    };
