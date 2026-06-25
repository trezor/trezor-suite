import { A, pipe } from '@mobily/ts-belt';

import type { DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectAccountStakeTypeTransactions,
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
import { isNftToken, shouldUppercaseTokenSymbol } from '@suite-common/wallet-utils';
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
        if (!account?.tokens) {
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

export const selectAccountStakeTypeTransactionsWithTokenTransfers = createMemoizedSelector(
    [selectAccountStakeTypeTransactions],
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

export const selectHasDeviceAnyTokensForNetwork = (
    state: TokensRootState,
    symbol: NetworkSymbol,
) => {
    if (!isNetworkWithTokens(symbol)) {
        return false;
    }

    const accounts = selectVisibleDeviceAccountsByNetworkSymbol(state, symbol);

    return A.any(accounts, account => (account.tokens ?? []).some(token => !isNftToken(token)));
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
