import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type AccountKey } from '@suite-common/wallet-types';

import { accountsActions } from '../accounts/accountsActions';

export type EarnTransactionFlow =
    | 'stake'
    | 'unstake'
    | 'claim'
    | 'withdraw'
    | 'vote'
    | 'yield-deposit'
    | 'yield-withdraw'
    | 'yield-claim';

export type TrackedEarnTransaction = {
    accountKey: AccountKey;
    txid: string;
    flow: EarnTransactionFlow;
};

export type EarnTransactionsState = Record<string, TrackedEarnTransaction>;

export type EarnTransactionsRootState = {
    wallet: {
        earnTransactions: EarnTransactionsState;
    };
};

export const EARN_TRANSACTION_TOAST_TYPE = {
    stake: 'tx-staked',
    unstake: 'tx-unstaked',
    claim: 'tx-claimed',
    withdraw: 'tx-withdrawn',
    vote: 'tx-voted',
    'yield-deposit': 'tx-yield-deposit',
    'yield-withdraw': 'tx-yield-withdraw',
    'yield-claim': 'tx-yield-claim',
} as const satisfies Record<EarnTransactionFlow, string>;

export type EarnTransactionToastType = (typeof EARN_TRANSACTION_TOAST_TYPE)[EarnTransactionFlow];

export const earnTransactionsInitialState: EarnTransactionsState = {};

type UntrackEarnTransactionPayload = Pick<TrackedEarnTransaction, 'accountKey' | 'txid'>;

export const getEarnTransactionKey = ({ accountKey, txid }: UntrackEarnTransactionPayload) =>
    `${accountKey}:${txid}`;

const earnTransactionsSlice = createSlice({
    name: 'earnTransactions',
    initialState: earnTransactionsInitialState,
    reducers: {
        trackEarnTransaction: (state, action: PayloadAction<TrackedEarnTransaction>) => {
            state[getEarnTransactionKey(action.payload)] = action.payload;
        },
        untrackEarnTransaction: (state, action: PayloadAction<UntrackEarnTransactionPayload>) => {
            delete state[getEarnTransactionKey(action.payload)];
        },
    },
    extraReducers: builder => {
        builder.addCase(accountsActions.removeAccount, (state, action) => {
            const removedAccountKeys = new Set(action.payload.map(account => account.key));

            Object.entries(state).forEach(([key, tracked]) => {
                if (removedAccountKeys.has(tracked.accountKey)) {
                    delete state[key];
                }
            });
        });
    },
});

export const earnTransactionsActions = earnTransactionsSlice.actions;
export const earnTransactionsReducer = earnTransactionsSlice.reducer;

export const selectTrackedEarnTransaction = (
    state: EarnTransactionsRootState,
    accountKey: AccountKey,
    txid: string,
): TrackedEarnTransaction | undefined =>
    state.wallet.earnTransactions[getEarnTransactionKey({ accountKey, txid })];
