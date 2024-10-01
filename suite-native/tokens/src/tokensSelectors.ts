import { A, G, pipe } from '@mobily/ts-belt';
import { memoizeWithArgs } from 'proxy-memoize';

import {
    selectFilterKnownTokens,
    selectIsSpecificCoinDefinitionKnown,
    TokenDefinitionsRootState,
} from '@suite-common/token-definitions';
import {
    AccountsRootState,
    DeviceRootState,
    selectAccountByKey,
    selectAccountTransactions,
    selectVisibleDeviceAccountsByNetworkSymbol,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import {
    AccountKey,
    TokenAddress,
    TokenInfoBranded,
    TokenSymbol,
} from '@suite-common/wallet-types';
import { TokenInfo, TokenTransfer } from '@trezor/blockchain-link';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { isCoinWithTokens } from './utils';
import { TypedTokenTransfer, WalletAccountTransaction } from './types';

export type TokensRootState = AccountsRootState & DeviceRootState & TokenDefinitionsRootState;

export const selectAccountTokenInfo = memoizeWithArgs(
    (
        state: AccountsRootState,
        accountKey?: AccountKey,
        tokenAddress?: TokenAddress,
    ): TokenInfoBranded | null => {
        const account = selectAccountByKey(state, accountKey);
        if (!account || !account.tokens) {
            return null;
        }

        return (
            (A.find(
                account.tokens,
                (token: TokenInfo) => token.contract === tokenAddress,
            ) as TokenInfoBranded) ?? null
        );
    },
    // 100 is a reasonable size for the cache
    { size: 100 },
);

export const selectAccountTokenSymbol = (
    state: AccountsRootState,
    accountKey?: AccountKey,
    tokenAddress?: TokenAddress,
): TokenSymbol | null => {
    const tokenInfo = selectAccountTokenInfo(state, accountKey, tokenAddress);

    if (!tokenInfo) {
        return null;
    }

    // FIXME: This is the only place in the codebase where we change case of token symbol.
    // The `toUpperCase()` operation is necessary because we are receiving wrongly formatted token symbol from connect.
    // Can be removed at the moment when desktop issue https://github.com/trezor/trezor-suite/issues/8037 is resolved.
    return tokenInfo.symbol.toUpperCase() as TokenSymbol;
};

export const selectAccountTokenTransactions = memoizeWithArgs(
    (
        state: TransactionsRootState,
        accountKey: AccountKey,
        tokenAddress: TokenAddress,
    ): WalletAccountTransaction[] =>
        pipe(
            selectAccountTransactions(state, accountKey),
            A.map(transaction => ({
                ...transaction,
                tokens: transaction.tokens.map((tokenTransfer: TokenTransfer) => ({
                    ...tokenTransfer,
                    symbol: tokenTransfer.symbol,
                })),
            })),
            A.filter(transaction =>
                A.some(
                    transaction.tokens,
                    tokenTransfer => tokenTransfer.contract === tokenAddress,
                ),
            ),
        ) as WalletAccountTransaction[],
    { size: 50 },
);

const selectAllAccountTokens = (
    state: AccountsRootState,
    accountKey: AccountKey,
): TokenInfoBranded[] => {
    const account = selectAccountByKey(state, accountKey);
    if (!account || !account.tokens) {
        return [];
    }

    return account.tokens as TokenInfoBranded[];
};

export const selectAnyOfTokensIsKnown = (
    state: TokenDefinitionsRootState & AccountsRootState,
    accountKey: AccountKey,
): boolean => {
    // It may be temping to reuse selectAccountsKnownTokens.length but this is faster
    const tokens = selectAllAccountTokens(state, accountKey);
    const account = selectAccountByKey(state, accountKey);

    if (!account?.symbol) {
        return false;
    }
    const result = A.any(tokens, token => {
        const isKnown = selectIsSpecificCoinDefinitionKnown(state, account.symbol, token.contract);

        return isKnown;
    });

    return result;
};

const isNotZeroAmountTransfer = (tokenTransfer: TokenTransfer) =>
    tokenTransfer.amount !== '' && tokenTransfer.amount !== '0';

/** Is not a transaction with zero amount and no internal transfers. */
const isNotEmptyTransaction = (transaction: WalletAccountTransaction) =>
    transaction.amount !== '0' ||
    (G.isArray(transaction.internalTransfers) && A.isNotEmpty(transaction.internalTransfers));

const isTransactionWithTokenTransfers = (transaction: WalletAccountTransaction) =>
    G.isArray(transaction.tokens) && A.isNotEmpty(transaction.tokens);

const selectAccountTransactionsWithTokensWithFiatRates = memoizeWithArgs(
    (
        state: TransactionsRootState & TokenDefinitionsRootState,
        accountKey: AccountKey,
        areTokenOnlyTransactionsIncluded: boolean,
    ): WalletAccountTransaction[] =>
        pipe(
            selectAccountTransactions(state, accountKey),
            A.map(transaction => ({
                ...transaction,
                tokens: pipe(
                    transaction?.tokens ?? [],
                    A.filter(isNotZeroAmountTransfer),
                    A.filter(token =>
                        selectIsSpecificCoinDefinitionKnown(
                            state,
                            transaction.symbol,
                            token.contract as TokenAddress,
                        ),
                    ),
                    A.map((tokenTransfer: TokenTransfer) => ({
                        ...tokenTransfer,
                        symbol: tokenTransfer.symbol,
                    })),
                ) as TypedTokenTransfer[],
            })),
            A.filter(
                transaction =>
                    isNotEmptyTransaction(transaction) ||
                    (areTokenOnlyTransactionsIncluded &&
                        isTransactionWithTokenTransfers(transaction)),
            ),
        ) as WalletAccountTransaction[],
    { size: 50 },
);

export const selectAccountOrTokenTransactions = (
    state: TransactionsRootState & TokenDefinitionsRootState,
    accountKey: AccountKey,
    tokenAddress: TokenAddress | null,
    areTokenOnlyTransactionsIncluded: boolean,
): WalletAccountTransaction[] => {
    if (tokenAddress) {
        return selectAccountTokenTransactions(state, accountKey, tokenAddress);
    }

    return selectAccountTransactionsWithTokensWithFiatRates(
        state,
        accountKey,
        areTokenOnlyTransactionsIncluded,
    ) as WalletAccountTransaction[];
};

export const selectAccountsKnownTokens = memoizeWithArgs(
    (
        state: AccountsRootState & TokenDefinitionsRootState,
        accountKey: AccountKey,
    ): TokenInfoBranded[] => {
        const account = selectAccountByKey(state, accountKey);
        if (!account || !isCoinWithTokens(account.symbol)) {
            return [];
        }

        return selectFilterKnownTokens(
            state,
            account.symbol,
            account.tokens ?? [],
        ) as TokenInfoBranded[];
    },
    { size: 50 },
);

export const selectNumberOfAccountTokensWithFiatRates = (
    state: TokenDefinitionsRootState & AccountsRootState,
    accountKey: AccountKey,
): number => {
    const account = selectAccountByKey(state, accountKey);

    if (!account || !isCoinWithTokens(account.symbol)) {
        return 0;
    }

    const tokens = selectAccountsKnownTokens(state, accountKey);

    return tokens.length;
};

export const selectHasDeviceAnyTokensForNetwork = (state: TokensRootState, coin: NetworkSymbol) => {
    if (!isCoinWithTokens(coin)) {
        return false;
    }

    const accounts = selectVisibleDeviceAccountsByNetworkSymbol(state, coin);

    return A.any(accounts, account => {
        const result = selectAnyOfTokensIsKnown(state, account.key);

        return result;
    });
};

export const selectAccountHasAnyKnownToken = (state: TokensRootState, accountKey: string) => {
    const account = selectAccountByKey(state, accountKey);

    if (!account || !isCoinWithTokens(account.symbol)) {
        return false;
    }

    const anyOfTokensIsKnown = selectAnyOfTokensIsKnown(state, accountKey);

    return anyOfTokensIsKnown;
};
