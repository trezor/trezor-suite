import { A } from '@mobily/ts-belt';
import { createTransform } from 'redux-persist';

import {
    type AccountsState,
    type FiatRatesState,
    type TransactionsState,
} from '@suite-common/wallet-core';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { selectHistoricRatesByTransactions } from '@suite-common/wallet-utils';

import { filterKeysByPartialMatch, selectDeviceStatesNotRemembered } from './utils';

export const walletPersistWhitelist = ['accounts', 'transactions'] satisfies Array<
    'accounts' | 'transactions'
>;

export const walletStopPersistTransform = createTransform<any, undefined>(
    () => undefined,
    undefined,
    {
        whitelist: walletPersistWhitelist,
    },
);

type OutboundState = {
    accounts: Readonly<AccountsState>;
    transactions: TransactionsState;
    fiat: FiatRatesState;
};

type InboundState = OutboundState & {
    [key: string]: any;
};

export const walletPersistTransform = createTransform<InboundState, OutboundState>(
    (inboundState, _, state) => {
        const devicesStatesNotRemembered = selectDeviceStatesNotRemembered(state);

        const accounts = A.filter(
            inboundState.accounts,
            account => !devicesStatesNotRemembered.includes(account?.deviceState),
        );

        const transactions = filterKeysByPartialMatch(
            inboundState.transactions.transactions,
            devicesStatesNotRemembered,
        );

        const phishing = filterKeysByPartialMatch(
            inboundState.transactions.phishing ?? {},
            devicesStatesNotRemembered,
        );

        const transactionFetchStatusDetail = filterKeysByPartialMatch(
            inboundState.transactions.fetchStatusDetail ?? {},
            devicesStatesNotRemembered,
        );

        // Persist only historic rates referenced by the transactions we keep (remembered
        // devices). Orphaned rates (from removed txs/forgotten devices) are dropped on the
        // next persist. The transactions array may contain nulls due to pagination, so
        // filter them out before matching (see TransactionsState typing).
        const rememberedTransactions = Object.values(transactions)
            .flat()
            .filter((tx): tx is WalletAccountTransaction => tx != null);

        const historic = selectHistoricRatesByTransactions(
            inboundState.fiat?.historic ?? {},
            rememberedTransactions,
        );

        return {
            accounts,
            transactions: {
                transactions,
                phishing,
                fetchStatusDetail: transactionFetchStatusDetail,
            },
            // Return the full FiatRatesState shape: autoMergeLevel2 replaces `wallet.fiat`
            // wholesale on rehydrate, so `current`/`lastWeek` must be present (empty) to keep
            // the slice well-formed for selectors. Only `historic` is actually persisted.
            fiat: { current: {}, lastWeek: {}, historic },
        };
    },
    undefined,
    {
        whitelist: ['wallet'],
    },
);
