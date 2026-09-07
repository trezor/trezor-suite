import { A } from '@mobily/ts-belt';
import { createTransform } from 'redux-persist';

import {
    type AccountsState,
    type EarnOnboardingState,
    type TransactionsState,
} from '@suite-common/wallet-core';

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
    earnOnboarding: EarnOnboardingState;
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

        const earnOnboarding = filterKeysByPartialMatch(
            inboundState.earnOnboarding ?? {},
            devicesStatesNotRemembered,
        );

        return {
            accounts,
            earnOnboarding,
            transactions: {
                transactions,
                phishing,
                fetchStatusDetail: transactionFetchStatusDetail,
            },
        };
    },
    undefined,
    {
        whitelist: ['wallet'],
    },
);
