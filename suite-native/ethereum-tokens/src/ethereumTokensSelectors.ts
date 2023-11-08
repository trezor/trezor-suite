import { A, G, pipe } from '@mobily/ts-belt';
import { memoizeWithArgs } from 'proxy-memoize';

import {
    AccountsRootState,
    selectAccountByKey,
    selectAccountTransactions,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import {
    AccountKey,
    TokenAddress,
    TokenInfoBranded,
    TokenSymbol,
} from '@suite-common/wallet-types';
import { TokenInfo, TokenTransfer } from '@trezor/blockchain-link';
import {
    FiatRatesRootState,
    selectFiatRatesByFiatRateKey,
    getFiatRateKeyFromTicker,
} from '@suite-native/fiat-rates';
import { selectFiatCurrencyCode, SettingsSliceRootState } from '@suite-native/module-settings';
import { isEthereumAccountSymbol } from '@suite-common/wallet-utils';

import { EthereumTokenTransfer, WalletAccountTransaction } from './types';

export const selectEthereumAccountTokenInfo = (
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
};

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
    state: FiatRatesRootState & SettingsSliceRootState,
    contract: TokenAddress,
    tokenSymbol?: TokenSymbol,
) => {
    if (!tokenSymbol) return false;
    const fiatCurrencyCode = selectFiatCurrencyCode(state);
    const fiatRateKey = getFiatRateKeyFromTicker(
        {
            symbol: 'eth',
            tokenAddress: contract,
        },
        fiatCurrencyCode,
    );
    const rates = selectFiatRatesByFiatRateKey(state, fiatRateKey);
    return !!rates?.rate;
};

export const selectAnyOfTokensHasFiatRates = (
    state: FiatRatesRootState & SettingsSliceRootState,
    tokens: TokenInfoBranded[],
) => A.any(tokens, token => selectEthereumTokenHasFiatRates(state, token.contract, token.symbol));

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
        state: TransactionsRootState & FiatRatesRootState & SettingsSliceRootState,
        accountKey: AccountKey,
        areTokenOnlyTransactionsIncluded: boolean,
    ): WalletAccountTransaction[] =>
        pipe(
            selectAccountTransactions(state, accountKey),
            A.map(transaction => ({
                ...transaction,
                tokens: pipe(
                    transaction.tokens,
                    A.filter(isNotZeroAmountTranfer),
                    A.filter(token =>
                        selectEthereumTokenHasFiatRates(
                            state,
                            token.contract as TokenAddress,
                            token.symbol as TokenSymbol,
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
    state: TransactionsRootState & FiatRatesRootState & SettingsSliceRootState,
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

export const selectEthereumAccountsTokensWithFiatRates = memoizeWithArgs(
    (
        state: FiatRatesRootState & SettingsSliceRootState,
        ethereumAccountKey: string,
    ): TokenInfoBranded[] => {
        const account = selectAccountByKey(state, ethereumAccountKey);
        if (!account || !isEthereumAccountSymbol(account.symbol)) return [];
        return A.filter(account.tokens ?? [], token =>
            selectEthereumTokenHasFiatRates(
                state,
                token.contract as TokenAddress,
                token.symbol as TokenSymbol,
            ),
        ) as TokenInfoBranded[];
    },
    { size: 50 },
);

export const selectIsEthereumAccountWithTokensWithFiatRates = (
    state: FiatRatesRootState & SettingsSliceRootState,
    ethereumAccountKey: AccountKey,
): boolean => {
    const account = selectAccountByKey(state, ethereumAccountKey);
    if (!account || G.isNullable(account.tokens) || !isEthereumAccountSymbol(account.symbol))
        return false;

    return (
        account.tokens,
        A.any(account.tokens, token =>
            selectEthereumTokenHasFiatRates(
                state,
                token.contract as TokenAddress,
                token.symbol as TokenSymbol,
            ),
        )
    );
};
