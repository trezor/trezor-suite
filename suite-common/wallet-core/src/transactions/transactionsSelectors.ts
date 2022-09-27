import { pipe, A, F } from '@mobily/ts-belt';
import { createSelector } from '@reduxjs/toolkit';

import { AccountKey } from '@suite-common/suite-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account, WalletAccountTransaction } from '@suite-common/wallet-types';
import { enhanceTransaction } from '@suite-common/wallet-utils';
import { AccountTransaction } from '@trezor/connect';

import { selectAccountByKey } from '../accounts/accountsReducer';
import type { TransactionsRootState, Txid } from './transactionsReducer';

export const selectIsLoadingTransactions = (state: TransactionsRootState) =>
    state.wallet.transactions.isLoading;

export const selectTransactionsPerCoin = (state: TransactionsRootState) =>
    state.wallet.transactions.transactions;

export const selectAccountTxids = (state: TransactionsRootState, accountKey: AccountKey) =>
    state.wallet.transactions.accountsTransactions[accountKey].allTxids;

export const selectAccountPageTxids = (
    state: TransactionsRootState,
    accountKey: AccountKey,
    page: number,
) => state.wallet.transactions.accountsTransactions[accountKey].pages[page];

const filterByTxIdAndEchnanceTransactions = (
    transactions: AccountTransaction[],
    txidsToKeep: Txid[],
    account: Account,
) =>
    pipe(
        transactions,
        A.filter(tx => txidsToKeep.includes(tx.txid)),
        A.map(tx => enhanceTransaction(tx, account)),
        F.toMutable, // just typecasting to mutable array
    );

export const selectAccountTransactions = createSelector(
    [
        selectTransactionsPerCoin,
        selectAccountTxids,
        selectAccountByKey,
        // I don't like a way how the extra input args are passed to the selector, I will try to figure out better way
        (_: any, accountKey: AccountKey) => accountKey,
    ],
    (transactionsPerCoin, accountTxids, account, _accountKey): WalletAccountTransaction[] => {
        if (!account || !transactionsPerCoin) return [];

        return filterByTxIdAndEchnanceTransactions(
            transactionsPerCoin[account.symbol]!,
            accountTxids,
            account,
        );
    },
);

export const selectAccountTransactionsForPage = createSelector(
    [
        selectTransactionsPerCoin,
        selectAccountPageTxids,
        selectAccountByKey,
        // I don't like a way how the extra input args are passed to the selector, I will try to figure out better way
        (_: any, accountKey: AccountKey) => accountKey,
        (_: any, _accountKey: AccountKey, page: number) => page,
    ],
    (
        transactionsPerCoin,
        accountPageTxids,
        account,
        _accountKey,
        _page,
    ): WalletAccountTransaction[] => {
        if (!account || !transactionsPerCoin || !accountPageTxids) return [];

        return filterByTxIdAndEchnanceTransactions(
            transactionsPerCoin[account.symbol]!,
            accountPageTxids,
            account,
        );
    },
);

export const selectTransactionByTxid = () =>
    createSelector(
        [
            // I don't like a way how the extra input args are passed to the selector, I will try to figure out better way
            (_: any, _networkSymbol: NetworkSymbol, txid: string) => txid,
            selectTransactionsPerCoin,
            (_: any, networkSymbol: NetworkSymbol, _txid: string) => networkSymbol,
        ],
        (txid, transactions, networkSymbol): AccountTransaction | null =>
            transactions
                ? A.find(transactions[networkSymbol]!, tx => tx.txid === txid) ?? null
                : null,
    );

export const selectTransactionByTxidAndAccount = createSelector(
    [
        (_state: any, txid: string) => txid,
        (state, _txid: string, accountKey: AccountKey) =>
            selectAccountTransactions(state, accountKey),
    ],

    (txid, accountTransactions) => accountTransactions.find(tx => tx.txid === txid) ?? null,
);
