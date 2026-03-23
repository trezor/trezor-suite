import { A, pipe } from '@mobily/ts-belt';

import type { DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    filterKnownTokens,
    getSimpleCoinDefinitionsByNetwork,
    selectIsSpecificCoinDefinitionKnown,
    selectTokenDefinitions,
} from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectAccountTransactions,
    selectAccounts,
    selectVisibleDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type TokenAddress,
    type TokenInfoBranded,
    type TokenSymbol,
} from '@suite-common/wallet-types';
import { shouldUppercaseTokenSymbol } from '@suite-common/wallet-utils';
import { type TokenInfo, type TokenTransfer } from '@trezor/blockchain-link';

import { type TypedTokenTransfer, type WalletAccountTransaction } from './types';
import { isNetworkWithTokens } from './utils';

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

        const lowerCaseTokenAddress = tokenAddress?.toLowerCase();

        const token = A.find(
            account.tokens,
            (t: TokenInfo) => t.contract.toLowerCase() === lowerCaseTokenAddress,
        );

        if (!token) {
            return null;
        }

        const symbol = shouldUppercaseTokenSymbol(token)
            ? token.symbol?.toUpperCase()
            : token.symbol;

        return {
            ...token,
            symbol,
        } as TokenInfoBranded;
    },
);

export const selectAccountTokenSymbol = createMemoizedSelector(
    [selectAccountTokenInfo],
    (tokenInfo): TokenSymbol | null => {
        if (!tokenInfo) {
            return null;
        }

        return tokenInfo.symbol as TokenSymbol;
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

    // For Stellar, all tokens are considered "known" since trustlines require explicit user action.
    // See comment in selectAccountsKnownTokens for details.
    if (account.networkType === 'stellar') {
        return tokens.length > 0;
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

export const selectAccountKnownTokens = createMemoizedSelector(
    [selectAccountByKey, selectTokenDefinitions],
    (account, tokenDefinitions): TokenInfoBranded[] => {
        if (!account || !isNetworkWithTokens(account.symbol)) {
            return returnStableArrayIfEmpty<TokenInfoBranded>([]);
        }

        // For Stellar, show all tokens without filtering.
        // Unlike EVM chains where tokens can be airdropped as spam, Stellar tokens (trustlines)
        // require explicit user action to activate - users must sign a transaction to add each
        // trustline. Therefore, all Stellar tokens on an account are intentionally added by the
        // user and should be displayed, even if they're not in the token-definitions list.
        if (account.networkType === 'stellar') {
            return returnStableArrayIfEmpty(account.tokens ?? []) as TokenInfoBranded[];
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

export const selectAccountKnownTokensWithBalance = createMemoizedSelector(
    [selectAccountKnownTokens],
    tokens => tokens.filter(token => parseFloat(token?.balance ?? '0') > 0),
);

export const selectNumberOfAccountKnownTokensWithBalance = createMemoizedSelector(
    [selectAccountKnownTokensWithBalance],
    tokens => tokens.length,
);

export const selectHasDeviceAnyTokensForNetwork = (
    state: TokensRootState,
    symbol: NetworkSymbol,
) => {
    if (!isNetworkWithTokens(symbol)) {
        return false;
    }

    const accounts = selectVisibleDeviceAccountsByNetworkSymbol(state, symbol);

    return A.any(accounts, account => selectAnyOfTokensIsKnown(state, account.key));
};

export const selectHasDeviceAnyTokensWithBalanceForNetwork = (
    state: TokensRootState,
    symbol: NetworkSymbol,
) => {
    if (!isNetworkWithTokens(symbol)) {
        return false;
    }

    const accounts = selectVisibleDeviceAccountsByNetworkSymbol(state, symbol);

    return A.any(accounts, account => {
        const count = selectNumberOfAccountKnownTokensWithBalance(state, account.key);

        return count > 0;
    });
};

export const selectAccountHasAnyKnownToken = (state: TokensRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);

    if (!account || !isNetworkWithTokens(account.symbol)) {
        return false;
    }

    const anyOfTokensIsKnown = selectAnyOfTokensIsKnown(state, accountKey);

    return anyOfTokensIsKnown;
};

export const selectNetworkSymbolsOfAccountsWithTokensAllowed = createMemoizedSelector(
    [selectAccounts],
    accounts =>
        accounts
            .filter(a => isNetworkWithTokens(a.symbol))
            .reduce((acc, account) => {
                if (!acc.includes(account.symbol)) {
                    acc.push(account.symbol);
                }

                return acc;
            }, new Array<NetworkSymbol>()),
);
