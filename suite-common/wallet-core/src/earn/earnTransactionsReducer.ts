import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type AccountKey } from '@suite-common/wallet-types';

import { accountsActions } from '../accounts/accountsActions';

export type EarnTransactionFlow = 'stake' | 'unstake' | 'claim';

export type TrackedEarnTransaction = {
    flow: EarnTransactionFlow;
};

export type EarnTransactionsState = Record<AccountKey, Record<string, TrackedEarnTransaction>>;

export type EarnTransactionsRootState = {
    wallet: {
        earnTransactions: EarnTransactionsState;
    };
};

export const EARN_TRANSACTION_TOAST_TYPE = {
    stake: 'tx-staked',
    unstake: 'tx-unstaked',
    claim: 'tx-claimed',
} as const satisfies Record<EarnTransactionFlow, string>;

export const earnTransactionsInitialState: EarnTransactionsState = {};

type TrackEarnTransactionPayload = {
    accountKey: AccountKey;
    txid: string;
    flow: EarnTransactionFlow;
};

type UntrackEarnTransactionPayload = {
    accountKey: AccountKey;
    txid: string;
};

type ReplaceEarnTransactionTxidPayload = {
    accountKey: AccountKey;
    prevTxid: string;
    newTxid: string;
};

const earnTransactionsSlice = createSlice({
    name: 'earnTransactions',
    initialState: earnTransactionsInitialState,
    reducers: {
        trackEarnTransaction: (state, action: PayloadAction<TrackEarnTransactionPayload>) => {
            const { accountKey, txid, flow } = action.payload;

            state[accountKey] = { ...state[accountKey], [txid]: { flow } };
        },
        untrackEarnTransaction: (state, action: PayloadAction<UntrackEarnTransactionPayload>) => {
            const { accountKey, txid } = action.payload;
            const accountTransactions = state[accountKey];

            if (!accountTransactions) return;

            delete accountTransactions[txid];

            if (Object.keys(accountTransactions).length === 0) {
                delete state[accountKey];
            }
        },
        replaceEarnTransactionTxid: (
            state,
            action: PayloadAction<ReplaceEarnTransactionTxidPayload>,
        ) => {
            const { accountKey, prevTxid, newTxid } = action.payload;
            const accountTransactions = state[accountKey];
            const tracked = accountTransactions?.[prevTxid];

            if (!accountTransactions || !tracked) return;

            delete accountTransactions[prevTxid];
            accountTransactions[newTxid] = tracked;
        },
    },
    extraReducers: builder => {
        builder.addCase(accountsActions.removeAccount, (state, action) => {
            action.payload.forEach(account => {
                delete state[account.key];
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
): TrackedEarnTransaction | undefined => state.wallet.earnTransactions[accountKey]?.[txid];
