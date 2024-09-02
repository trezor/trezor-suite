import { A, G, pipe } from '@mobily/ts-belt';
import { memoizeWithArgs, memoize } from 'proxy-memoize';

import {
    AccountsRootState,
    DeviceRootState,
    selectAccountByKey,
    selectAccountTransactions,
    selectVisibleDeviceAccounts,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import {
    AccountKey,
    TokenAddress,
    TokenInfoBranded,
    TokenSymbol,
} from '@suite-common/wallet-types';
import { isEthereumAccountSymbol } from '@suite-common/wallet-utils';
import { TokenInfo, TokenTransfer } from '@trezor/blockchain-link';

import {
    selectCoinDefinition,
    selectFilterKnownTokens,
    selectIsSpecificCoinDefinitionKnown,
    TokenDefinitionsRootState,
} from '@suite-common/token-definitions';
import { EthereumTokenTransfer, WalletAccountTransaction } from './types';

export const selectEthereumAccountTokenInfo = memoizeWithArgs(
    (
        state: AccountsRootState,
        accountKey?: AccountKey,
        tokenAddress?: TokenAddress,
    ): TokenInfoBranded | null => {
        const account = selectAccountByKey(state, accountKey);
        if (!account || !account.tokens) return null;

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

export const selectEthereumAccountTokenSymbol = (
    state: AccountsRootState,
    accountKey?: AccountKey,
    tokenAddress?: TokenAddress,
): TokenSymbol | null => {
    const tokenInfo = selectEthereumAccountTokenInfo(state, accountKey, tokenAddress);

    if (!tokenInfo) return null;

    // FIXME: This is the only place in the codebase where we change case of token symbol.
    // The `toUpperCase()` operation is necessary because we are receiving wrongly formatted token symbol from connect.
    // Can be removed at the moment when desktop issue https://github.com/trezor/trezor-suite/issues/8037 is resolved.
    return tokenInfo.symbol.toUpperCase() as TokenSymbol;
};

export const selectEthereumAccountTokenTransactions = memoizeWithArgs(
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
    { size: 500 },
);

export const selectEthereumTokenHasFiatRates = (
    state: TokenDefinitionsRootState,
    contract: TokenAddress,
) => {
    return selectIsSpecificCoinDefinitionKnown(state, 'eth', contract);
};

export const selectAnyOfTokensHasFiatRates = (
    state: TokenDefinitionsRootState,
    tokens: TokenInfoBranded[],
) => A.any(tokens, token => selectEthereumTokenHasFiatRates(state, token.contract));

const isNotZeroAmountTranfer = (tokenTranfer: TokenTransfer) =>
    tokenTranfer.amount !== '' && tokenTranfer.amount !== '0';

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
                    A.filter(isNotZeroAmountTranfer),
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
                ) as EthereumTokenTransfer[],
            })),
            A.filter(
                transaction =>
                    isNotEmptyTransaction(transaction) ||
                    (areTokenOnlyTransactionsIncluded &&
                        isTransactionWithTokenTransfers(transaction)),
            ),
        ) as WalletAccountTransaction[],
    { size: 500 },
);

export const selectAccountOrTokenAccountTransactions = (
    state: TransactionsRootState & TokenDefinitionsRootState,
    accountKey: AccountKey,
    tokenAddress: TokenAddress | null,
    areTokenOnlyTransactionsIncluded: boolean,
): WalletAccountTransaction[] => {
    if (tokenAddress) {
        return selectEthereumAccountTokenTransactions(state, accountKey, tokenAddress);
    }

    return selectAccountTransactionsWithTokensWithFiatRates(
        state,
        accountKey,
        areTokenOnlyTransactionsIncluded,
    ) as WalletAccountTransaction[];
};

export const selectUniqueEtheruemTokens = (state: AccountsRootState & DeviceRootState) => {
    const accounts = selectVisibleDeviceAccounts(state);

    return pipe(
        accounts,
        A.filter(account => isEthereumAccountSymbol(account.symbol)),
        A.map(account => account.tokens?.map(token => token.contract)),
        A.flat,
        // Don't use A.uniq(By) because it's slow for large arrays
        t => Array.from(new Set(t)),
        A.filter(tokenAddress => !!tokenAddress),
    ) as TokenAddress[];
};

export const selectEthereumAccountsTokensWithFiatRates = memoizeWithArgs(
    (
        state: AccountsRootState & TokenDefinitionsRootState,
        ethereumAccountKey: AccountKey,
    ): TokenInfoBranded[] => {
        const account = selectAccountByKey(state, ethereumAccountKey);
        if (!account || !isEthereumAccountSymbol(account.symbol)) return [];

        return selectFilterKnownTokens(
            state,
            account.symbol,
            account.tokens ?? [],
        ) as TokenInfoBranded[];
    },
    { size: 50 },
);

export const selectNumberOfEthereumAccountTokensWithFiatRates = (
    state: TokenDefinitionsRootState & AccountsRootState,
    ethereumAccountKey: AccountKey,
): number => {
    const tokens = selectEthereumAccountsTokensWithFiatRates(state, ethereumAccountKey);

    return tokens.length;
};

export const selectIsEthereumAccountWithTokensWithFiatRates = (
    state: TokenDefinitionsRootState & AccountsRootState,
    ethereumAccountKey: AccountKey,
): boolean => {
    return selectNumberOfEthereumAccountTokensWithFiatRates(state, ethereumAccountKey) > 0;
};

export const selectNumberOfUniqueEthereumTokensPerDevice = memoize(
    (state: AccountsRootState & DeviceRootState & TokenDefinitionsRootState) => {
        return pipe(
            selectUniqueEtheruemTokens(state),
            A.filter(tokenAddress => !!selectCoinDefinition(state, 'eth', tokenAddress)),
            A.length,
        );
    },
);
