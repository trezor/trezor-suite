import {
    type TokenDefinitionsRootState,
    hasNetworkPotentialFraudTransactions,
    isPhishingTransaction,
} from '@suite-common/token-definitions';
import type { SuspiciousTransactionsContext } from '@suite-common/transaction-store';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FiatRatesRootState,
    type PhishingRootState,
    type TransactionsRootState,
    type WalletSettingsRootState,
    selectAccountTransactions,
    selectActiveDustPhishingThreshold,
    selectIsHideSuspiciousTransactions,
    selectPhishingTransactionsContext,
} from '@suite-common/wallet-core';
import type { AccountKey } from '@suite-common/wallet-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

type SuspiciousTransactionsState = AccountsRootState &
    FiatRatesRootState &
    PhishingRootState &
    TokenDefinitionsRootState &
    TransactionsRootState &
    WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<SuspiciousTransactionsState>();

/**
 * What the store needs to hide an account's suspicious transactions, or `undefined` while the
 * user shows them. The store detects most in SQL; dust needs historic fiat rates, which only the
 * app has, so the store hides the dust the app found among the transactions Redux holds.
 */
export const selectTransactionStoreHideSuspicious = createMemoizedSelector(
    [
        (state, _accountKey: AccountKey, symbol: NetworkSymbol) =>
            selectIsHideSuspiciousTransactions(state, symbol),
        (state, accountKey: AccountKey, symbol: NetworkSymbol) =>
            selectPhishingTransactionsContext(state, accountKey, symbol),
        selectActiveDustPhishingThreshold,
        (state, accountKey: AccountKey) => selectAccountTransactions(state, accountKey),
        (_state, _accountKey: AccountKey, symbol: NetworkSymbol) => symbol,
    ],
    (
        isHiding,
        { tokenDefinitions, txsMarkedAsNotScam, historicRates },
        dustThreshold,
        transactions,
        symbol,
    ): SuspiciousTransactionsContext | undefined => {
        if (!isHiding || !hasNetworkPotentialFraudTransactions(symbol)) return undefined;

        return {
            notScamTxids: txsMarkedAsNotScam,
            flaggedTxids: transactions
                .filter(
                    transaction =>
                        isPhishingTransaction({
                            transaction,
                            tokenDefinitions,
                            txsMarkedAsNotScam,
                            historicRates,
                            dustThreshold,
                        }).isPhishing,
                )
                .map(({ txid }) => txid),
        };
    },
);
