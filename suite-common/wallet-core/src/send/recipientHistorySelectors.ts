import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type TokenDefinitionsRootState,
    isPhishingTransaction,
} from '@suite-common/token-definitions';
import { type AccountKey } from '@suite-common/wallet-types';

import { getRecipientHistory, isRecipientHistoryCheckSupported } from './recipientHistory';
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

export const selectAccountRecipientHistory = createMemoizedSelector(
    [
        selectAccountByKey,
        selectAccountTransactions,
        (state: RecipientHistoryRootState, accountKey: AccountKey) => {
            const account = selectAccountByKey(state, accountKey);

            return account
                ? selectPhishingTransactionsContext(state, accountKey, account.symbol)
                : undefined;
        },
        selectActiveDustPhishingThreshold,
    ],
    (account, transactions, phishingContext, dustThreshold) => {
        if (
            !account ||
            !phishingContext ||
            !isRecipientHistoryCheckSupported(account.networkType)
        ) {
            return undefined;
        }

        return getRecipientHistory({
            transactions,
            descriptor: account.descriptor,
            networkType: account.networkType,
            isPhishing: transaction =>
                isPhishingTransaction({ transaction, ...phishingContext, dustThreshold })
                    .isPhishing,
        });
    },
);
