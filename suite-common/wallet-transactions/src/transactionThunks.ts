import { Account, PrecomposedTransactionFinal, TxFinalCardano } from '@suite-common/wallet-types';
import {
    findTransactions,
    formatNetworkAmount,
    getAccountTransactions,
    isTrezorConnectBackendType,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { createThunk } from '@suite-common/redux-utils';
import { accountsActions } from '@suite-common/wallet-core';

import { selectTransactions } from './transactionReducer';
import { modulePrefix } from './transactionConstants';
import { transactionActions } from './transactionActions';

/**
 * Replace existing transaction in the reducer.
 * There might be multiple occurrences of the same transaction assigned to multiple accounts in the storage:
 * sender account and receiver account(s)
 */
export const replaceTransactionThunk = createThunk(
    `${modulePrefix}/replaceTransactionThunk`,
    (
        {
            account,
            tx,
            newTxid,
        }: {
            account: Account;
            tx: PrecomposedTransactionFinal;
            newTxid: string;
        },
        { getState, dispatch },
    ) => {
        if (!tx.prevTxid) return; // ignore if it's not replacement tx

        const walletTransactions = selectTransactions(getState());

        // find all transactions to replace, they may be related to another account
        const transactions = findTransactions(tx.prevTxid, walletTransactions);
        const newFee = formatNetworkAmount(tx.fee, account.symbol);
        const newBaseFee = parseInt(tx.fee, 10);

        // prepare replace actions for txs
        const actions = transactions.map(t => {
            const action = {
                type: transactionActions.replaceTransaction.type,
                payload: {
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
                },
            };
            // finalized and recv tx shouldn't have rbfParams
            if (!tx.rbf || t.tx.type === 'recv') {
                delete action.payload.tx.rbfParams;
                return action;
            }

            if (action.payload.tx.type === 'self') {
                action.payload.tx.amount = newFee;
            }
            // update tx rbfParams
            if (action.payload.tx.rbfParams) {
                action.payload.tx.rbfParams = {
                    ...action.payload.tx.rbfParams,
                    txid: newTxid,
                    baseFee: newBaseFee,
                    feeRate: tx.feePerByte,
                };
            }
            return action;
        });
        // dispatch replace actions
        actions.forEach(a => dispatch(a));
    },
);

export const addFakePendingTxThunk = createThunk(
    `${modulePrefix}/addFakePendingTransaction`,
    (
        {
            precomposedTx,
            txid,
            account,
        }: {
            precomposedTx: Pick<PrecomposedTransactionFinal | TxFinalCardano, 'totalSpent' | 'fee'>;
            txid: string;
            account: Account;
        },
        { dispatch },
    ) => {
        // Used in cardano send form and staking tab until Blockfrost supports pending txs on its backend
        // https://github.com/trezor/trezor-suite/issues/4932
        const fakeTx = {
            type: 'sent' as const,
            txid,
            blockTime: Math.floor(new Date().getTime() / 1000),
            blockHash: undefined,
            // amounts (as most of props below) don't matter much since it is temp fake anyway
            amount: precomposedTx.totalSpent,
            fee: precomposedTx.fee,
            totalSpent: precomposedTx.totalSpent,
            targets: [],
            tokens: [],
            cardanoSpecific: {
                subtype: null,
            },
            details: {
                vin: [],
                vout: [],
                size: 0,
                totalInput: '0',
                totalOutput: '0',
            },
        };
        dispatch(transactionActions.addTransaction({ transactions: [fakeTx], account }));
    },
);

// TODO add this through extras and remove generator from transactionActions.ts
export const fetchTransactionsThunk = createThunk(
    `${modulePrefix}/addFakePendingTransaction`,
    async (
        {
            account,
            page,
            perPage,
            noLoading = false,
            recursive = false,
        }: {
            account: Account;
            page: number;
            perPage: number;
            noLoading?: boolean;
            recursive?: boolean;
        },
        { dispatch, getState },
    ) => {
        if (!isTrezorConnectBackendType(account.backendType)) return; // skip unsupported backend type
        const transactions = selectTransactions(getState());
        const reducerTxs = getAccountTransactions(account.key, transactions);

        const startIndex = (page - 1) * perPage;
        const stopIndex = startIndex + perPage;
        const txsForPage = reducerTxs.slice(startIndex, stopIndex).filter(tx => !!tx.txid); // filter out "empty" values

        // we already got txs for the page in reducer
        if (
            (page > 1 && txsForPage.length === perPage) ||
            txsForPage.length === account.history.total
        ) {
            if (recursive) {
                await dispatch(
                    fetchTransactionsThunk({
                        account,
                        page: page + 1,
                        perPage,
                        noLoading,
                        recursive: true,
                    }),
                );
            }

            return;
        }

        if (!noLoading) {
            dispatch(transactionActions.fetchInit);
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
            // TODO why is this only accepting account now?
            const updateAction = accountsActions.updateAccount(account, result.payload);
            const updatedAccount = updateAction.payload as Account;
            const transactions = result.payload.history.transactions || [];
            const totalPages = result.payload.page?.total || 0;

            dispatch(transactionActions.fetchSuccess);
            dispatch(
                transactionActions.addTransaction({
                    transactions,
                    account: updatedAccount,
                    page,
                }),
            );
            // updates the marker/page object for the account
            dispatch(updateAction);

            // totalPages (blockbook + blockfrost), marker (ripple) if is undefined, no more pages are available
            if (recursive && (page < totalPages || (marker && updatedAccount.marker))) {
                await dispatch(
                    fetchTransactionsThunk({
                        account: updatedAccount,
                        page: page + 1,
                        perPage,
                        noLoading,
                        recursive: true,
                    }),
                );
            }
        } else {
            dispatch(
                transactionActions.fetchError({
                    error: result ? result.payload.error : 'unknown error',
                }),
            );
        }
    },
);
