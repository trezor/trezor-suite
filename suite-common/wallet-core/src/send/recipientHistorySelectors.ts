import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    isPhishingTransaction,
} from '@suite-common/token-definitions';
import { type NetworkType } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import { getRecipientHistory } from './recipientHistory';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccountByKey } from '../accounts/accountsSelectors';
import { type FiatRatesRootState } from '../fiat-rates/fiatRatesTypes';
import { type PhishingRootState } from '../phishing/phishingReducerTypes';
import { selectActiveDustPhishingThreshold } from '../phishing/phishingSelectors';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import {
    selectAccountTransactions,
    selectPhishingTransactionsContext,
} from '../transactions/transactionsSelectors';

type RecipientHistoryRootState = AccountsRootState &
    TransactionsRootState &
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
        if (
            !descriptor ||
            !networkType ||
            !phishingContext ||
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
