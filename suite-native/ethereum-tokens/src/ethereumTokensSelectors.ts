import { A, G, pipe } from '@mobily/ts-belt';
import { memoizeWithArgs } from 'proxy-memoize';

import {
    AccountsRootState,
    selectAccountByKey,
    selectAccountTransactions,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { TokenInfo, TokenTransfer } from '@trezor/blockchain-link';

import {
    EthereumTokenAccountWithBalance,
    EthereumTokenSymbol,
    WalletAccountTransaction,
} from './types';
import { isEthereumAccountSymbol } from './utils';

export const filterTokenHasBalance = (token: TokenInfo) => !!token.balance && token.balance !== '0';

export const selectEthereumAccountsTokensWithBalance = memoizeWithArgs(
    (state: AccountsRootState, ethereumAccountKey: string): EthereumTokenAccountWithBalance[] => {
        const account = selectAccountByKey(state, ethereumAccountKey);
        if (!account || !isEthereumAccountSymbol(account.symbol)) return [];
        return A.filter(
            account.tokens ?? [],
            filterTokenHasBalance,
        ) as EthereumTokenAccountWithBalance[];
    },
    { size: 50 },
);

// If account item is ethereum which has tokens with non-zero balance,
// we want to adjust styling to display token items.
export const selectIsEthereumAccountWithTokensWithBalance = (
    state: AccountsRootState,
    ethereumAccountKey: AccountKey,
): boolean => {
    const account = selectAccountByKey(state, ethereumAccountKey);
    return (
        !!account &&
        isEthereumAccountSymbol(account.symbol) &&
        G.isArray(account.tokens) &&
        A.isNotEmpty(account.tokens.filter(filterTokenHasBalance))
    );
};

export const selectEthereumAccountToken = (
    state: AccountsRootState,
    accountKey: AccountKey,
    tokenSymbol?: EthereumTokenSymbol,
): TokenInfo | null => {
    const account = selectAccountByKey(state, accountKey);
    if (!account || !account.tokens) return null;
    return A.find(account.tokens, (token: TokenInfo) => token.symbol === tokenSymbol) ?? null;
};

export const selectEthereumAccountTokenTransactions = memoizeWithArgs(
    (
        state: TransactionsRootState,
        accountKey: AccountKey,
        tokenSymbol: EthereumTokenSymbol,
    ): WalletAccountTransaction[] =>
        pipe(
            selectAccountTransactions(state, accountKey),
            A.map(transaction => ({
                ...transaction,
                tokens: transaction.tokens.map((tokenTransfer: TokenTransfer) => ({
                    ...tokenTransfer,
                    symbol: tokenTransfer.symbol.toLowerCase(),
                })),
            })),
            A.filter(transaction =>
                A.some(transaction.tokens, tokenTransfer => tokenTransfer.symbol === tokenSymbol),
            ),
        ) as WalletAccountTransaction[],
    { size: 500 },
);

export const selectAccountOrTokenAccountTransactions = (
    state: TransactionsRootState,
    accountKey: AccountKey,
    tokenSymbol: EthereumTokenSymbol | null,
): WalletAccountTransaction[] => {
    if (tokenSymbol) {
        return selectEthereumAccountTokenTransactions(state, accountKey, tokenSymbol);
    }
    return selectAccountTransactions(state, accountKey) as WalletAccountTransaction[];
};
