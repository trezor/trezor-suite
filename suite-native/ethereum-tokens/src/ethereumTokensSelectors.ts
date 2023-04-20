import { A, G, pipe } from '@mobily/ts-belt';
import { memoizeWithArgs } from 'proxy-memoize';

import {
    AccountsRootState,
    selectAccountByKey,
    selectAccountTransactions,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { TokenInfo, TokenTransfer } from '@trezor/blockchain-link';
import {
    FiatRatesRootState,
    selectFiatRatesByFiatRateKey,
    getFiatRateKeyFromTicker,
} from '@suite-native/fiat-rates';
import { selectFiatCurrencyCode, SettingsSliceRootState } from '@suite-native/module-settings';

import { EthereumTokenSymbol, WalletAccountTransaction } from './types';
import { isEthereumAccountSymbol } from './utils';

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

export const selectEthereumTokenHasFiatRates = (
    state: FiatRatesRootState & SettingsSliceRootState,
    contract: TokenAddress,
    tokenSymbol?: TokenSymbol,
) => {
    if (!tokenSymbol) return false;
    const fiatCurrencyCode = selectFiatCurrencyCode(state);
    const fiatRateKey = getFiatRateKeyFromTicker(
        {
            symbol: tokenSymbol.toUpperCase() as TokenSymbol,
            mainNetworkSymbol: 'eth',
            tokenAddress: contract,
        },
        fiatCurrencyCode,
    );
    const rates = selectFiatRatesByFiatRateKey(state, fiatRateKey);
    return !!rates?.rate;
};

export const selectEthereumAccountsTokensWithFiatRates = memoizeWithArgs(
    (state: FiatRatesRootState & SettingsSliceRootState, ethereumAccountKey: string) => {
        const account = selectAccountByKey(state, ethereumAccountKey);
        if (!account || !isEthereumAccountSymbol(account.symbol)) return [];
        return A.filter(account.tokens ?? [], token =>
            selectEthereumTokenHasFiatRates(
                state,
                token.contract as TokenAddress,
                token.symbol as TokenSymbol,
            ),
        );
    },
    { size: 50 },
);

// If account item is ethereum which has tokens with fiat rates,
// we want to adjust styling to display token items.
export const selectIsEthereumAccountWithTokensWithFiatRates = (
    state: FiatRatesRootState & SettingsSliceRootState,
    ethereumAccountKey: AccountKey,
): boolean => {
    const account = selectAccountByKey(state, ethereumAccountKey);
    if (!account || G.isNullable(account.tokens) || !isEthereumAccountSymbol(account.symbol))
        return false;
    return A.isNotEmpty(
        A.filterMap(account.tokens, token =>
            selectEthereumTokenHasFiatRates(
                state,
                token.contract as TokenAddress,
                token.symbol as TokenSymbol,
            ),
        ),
    );
};
