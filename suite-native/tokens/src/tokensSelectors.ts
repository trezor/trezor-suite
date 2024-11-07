import { A, pipe } from '@mobily/ts-belt';

import {
    filterKnownTokens,
    getSimpleCoinDefinitionsByNetwork,
    selectIsSpecificCoinDefinitionKnown,
    selectTokenDefinitions,
    TokenDefinitionsRootState,
} from '@suite-common/token-definitions';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    selectAccountByKey,
    selectAccounts,
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
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';

import { TypedTokenTransfer, WalletAccountTransaction } from './types';
import { isCoinWithTokens } from './utils';

export type TokensRootState = AccountsRootState &
    DeviceRootState &
    TokenDefinitionsRootState &
    TransactionsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<TokensRootState>();

export const selectAccountTokenInfo = createMemoizedSelector(
    [
        selectAccountByKey,
        (_state, _accountKey?: AccountKey, tokenAddress?: TokenAddress) => tokenAddress,
    ],
    (account, tokenAddress?: TokenAddress): TokenInfoBranded | null => {
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
);

export const selectAccountTokenSymbol = createMemoizedSelector(
    [selectAccountTokenInfo],
    (tokenInfo): TokenSymbol | null => {
        if (!tokenInfo) {
            return null;
        }

        // FIXME: This is the only place in the codebase where we change case of token symbol.
        // The `toUpperCase()` operation is necessary because we are receiving wrongly formatted token symbol from connect.
        // Can be removed at the moment when desktop issue https://github.com/trezor/trezor-suite/issues/8037 is resolved.
        return tokenInfo.symbol.toUpperCase() as TokenSymbol;
    },
);

export const selectAccountTokenBalance = createMemoizedSelector(
    [selectAccountTokenInfo],
    (tokenInfo): string | null => {
        if (!tokenInfo) {
            return null;
        }

        return tokenInfo.balance ?? null;
    },
);

export const selectAccountTokenDecimals = createMemoizedSelector(
    [selectAccountTokenInfo],
    (tokenInfo): number | null => {
        if (!tokenInfo) {
            return null;
        }

        return tokenInfo.decimals ?? null;
    },
);

export const selectAccountTokenTransactions = createMemoizedSelector(
    [
        selectAccountTransactions,
        (_state, _accountKey: AccountKey, tokenAddress: TokenAddress) => tokenAddress,
    ],
    (transactions, tokenAddress): WalletAccountTransaction[] =>
        pipe(
            transactions,
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
            returnStableArrayIfEmpty,
        ) as WalletAccountTransaction[],
);

const selectAllAccountTokens = (
    state: AccountsRootState,
    accountKey: AccountKey,
): TokenInfoBranded[] => {
    const account = selectAccountByKey(state, accountKey);

    return returnStableArrayIfEmpty(account?.tokens) as TokenInfoBranded[];
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

export const selectAccountTransactionsWithTokenTransfers = createMemoizedSelector(
    [selectAccountTransactions],
    (transactions): WalletAccountTransaction[] =>
        pipe(
            transactions,
            A.map(transaction => ({
                ...transaction,
                tokens: pipe(
                    transaction?.tokens ?? [],
                    A.map((tokenTransfer: TokenTransfer) => ({
                        ...tokenTransfer,
                        symbol: tokenTransfer.symbol,
                    })),
                ) as TypedTokenTransfer[],
            })),
        ) as WalletAccountTransaction[],
);

export const selectAccountsKnownTokens = createMemoizedSelector(
    [selectAccountByKey, selectTokenDefinitions],
    (account, tokenDefinitions): TokenInfoBranded[] => {
        if (!account || !isCoinWithTokens(account.symbol)) {
            return returnStableArrayIfEmpty<TokenInfoBranded>([]);
        }

        const tokenDefinitionsForNetwork = getSimpleCoinDefinitionsByNetwork(
            tokenDefinitions,
            account.symbol,
        );

        const knownTokens = filterKnownTokens(
            tokenDefinitionsForNetwork,
            account.symbol,
            account.tokens ?? [],
        ) as TokenInfoBranded[];

        return returnStableArrayIfEmpty(knownTokens);
    },
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

export const selectNetworkSymbolsOfAccountsWithTokensAllowed = createMemoizedSelector(
    [selectAccounts],
    accounts =>
        accounts
            .filter(a => isCoinWithTokens(a.symbol))
            .reduce((acc, account) => {
                if (!acc.includes(account.symbol)) {
                    acc.push(account.symbol);
                }

                return acc;
            }, new Array<NetworkSymbol>()),
);
