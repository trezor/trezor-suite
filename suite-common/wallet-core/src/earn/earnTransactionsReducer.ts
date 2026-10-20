import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type events } from '@suite-common/analytics';
import { type AccountKey } from '@suite-common/wallet-types';

import { accountsActions } from '../accounts/accountsActions';
import { transactionsActions } from '../transactions/transactionsActions';

export type EarnTransactionFlow = events.TransactionBroadcastStatusFlow;

export type TrackedEarnTransaction = {
    accountKey: AccountKey;
    txid: string;
    flow: EarnTransactionFlow;
    isCancellation: boolean;
    isRbf: boolean;
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
    'yield-redeem': 'tx-yield-withdraw',
    'merkl-claim': 'tx-yield-claim',
    approve: null,
    revoke: null,
    wrap: null,
    unwrap: null,
} as const satisfies Record<EarnTransactionFlow, string | null>;

export type EarnTransactionToastType = NonNullable<
    (typeof EARN_TRANSACTION_TOAST_TYPE)[EarnTransactionFlow]
>;

export const earnTransactionsInitialState: EarnTransactionsState = {};

type UntrackEarnTransactionPayload = Pick<TrackedEarnTransaction, 'accountKey' | 'txid'>;

export const getEarnTransactionKey = ({ accountKey, txid }: UntrackEarnTransactionPayload) =>
    `${accountKey}:${txid}`;

const earnTransactionsSlice = createSlice({
    name: 'earnTransactions',
    initialState: earnTransactionsInitialState,
    reducers: {
        untrackEarnTransaction: (state, action: PayloadAction<UntrackEarnTransactionPayload>) => {
            delete state[getEarnTransactionKey(action.payload)];
        },
    },
    extraReducers: builder => {
        builder.addCase(
            transactionsActions.transactionBroadcastStatus,
            (state: EarnTransactionsState, { payload }) => {
                if (payload.status === 'success') {
                    const tracked = {
                        accountKey: payload.account.key,
                        txid: payload.txid,
                        flow: payload.flow,
                        isCancellation: payload.isCancellation ?? false,
                        isRbf: payload.isRbf ?? false,
                    };
                    state[getEarnTransactionKey(tracked)] = tracked;
                }
            },
        );
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
