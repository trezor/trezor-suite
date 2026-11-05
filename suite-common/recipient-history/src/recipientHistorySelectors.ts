import {
    type TokenDefinitionsRootState,
    isPhishingTransaction,
} from '@suite-common/token-definitions';
import { type NetworkType } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    type PhishingRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectAccountTransactions,
    selectActiveDustPhishingThreshold,
    selectPhishingTransactionsContext,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

import { getRecipientHistory } from './recipientHistory';

export type RecipientHistoryRootState = TransactionsRootState &
    TokenDefinitionsRootState &
    FiatRatesRootState &
    PhishingRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<RecipientHistoryRootState>();

const isRecipientHistoryCheckSupportedByNetworkType: Record<NetworkType, boolean> = {
    bitcoin: false,
    cardano: false,
    ethereum: true,
    ripple: false,
    // Outgoing SPL transfers record the recipient's token account, not the wallet address users paste.
    solana: false,
    stellar: false,
    tron: true,
};

export const selectAccountRecipientHistory = createMemoizedSelector(
    // Primitives rather than the account object, which is replaced on every balance update.
    [
        (state: RecipientHistoryRootState, accountKey: AccountKey) =>
            selectAccountByKey(state, accountKey)?.descriptor,
        (state: RecipientHistoryRootState, accountKey: AccountKey) =>
            selectAccountByKey(state, accountKey)?.networkType,
        selectAccountTransactions,
        (state: RecipientHistoryRootState, accountKey: AccountKey) => {
            const account = selectAccountByKey(state, accountKey);

            return account
                ? selectPhishingTransactionsContext(state, accountKey, account.symbol)
                : undefined;
        },
        selectActiveDustPhishingThreshold,
    ],
    (descriptor, networkType, transactions, phishingContext, dustThreshold) => {
        // A funded account always has a transaction, so none means the history isn't loaded.
        if (
            !descriptor ||
            !networkType ||
            !phishingContext ||
            transactions.length === 0 ||
            !isRecipientHistoryCheckSupportedByNetworkType[networkType]
        ) {
            return undefined;
        }

        return getRecipientHistory({
            transactions,
            descriptor,
            networkType,
            isPhishing: transaction =>
                isPhishingTransaction({ transaction, ...phishingContext, dustThreshold })
                    .isPhishing,
        });
    },
);
