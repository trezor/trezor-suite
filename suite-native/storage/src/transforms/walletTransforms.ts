import { A } from '@mobily/ts-belt';
import { createTransform } from 'redux-persist';

import { AccountsState, TransactionsState } from '@suite-common/wallet-core';

import { selectDeviceStatesNotRemembered, filterKeysByPartialMatch } from './utils';

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

        const transactionFetchStatusDetail = filterKeysByPartialMatch(
            inboundState.transactions.fetchStatusDetail ?? {},
            devicesStatesNotRemembered,
        );

        return {
            accounts,
            transactions: {
                transactions,
                fetchStatusDetail: transactionFetchStatusDetail,
            },
        };
    },
    undefined,
    {
        whitelist: ['wallet'],
    },
);
