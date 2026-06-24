import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type Account } from '@suite-common/wallet-types';

import { accountsActions } from './accountsActions';

// Per-account "last refreshed at" timestamp, kept next to the accounts (but in its own slice, so
// updating it does NOT churn the account entity reference). Used to throttle the selected-account
// refresh. It reacts to the account lifecycle actions, so the timestamp lives in exactly one place
// and is testable as a plain reducer. Keyed by the unique account key (descriptor-symbol-session),
// not the descriptor alone, which can collide across devices/wallets.
export type AccountsRefreshTimeState = Record<Account['key'], number>;

export type AccountsRefreshTimeRootState = {
    wallet: {
        accountsRefreshTime: AccountsRefreshTimeState;
    };
};

export const accountsRefreshTimeInitialState: AccountsRefreshTimeState = {};

const accountsRefreshTimeSlice = createSlice({
    name: 'accountsRefreshTime',
    initialState: accountsRefreshTimeInitialState,
    reducers: {
        // Marks a refresh event that did not change the account – i.e. did not dispatch createAccount or updateAccount.
        accountRefreshed: (state, action: PayloadAction<Account['key']>) => {
            state[action.payload] = Date.now();
        },
    },
    extraReducers: builder => {
        builder
            .addCase(accountsActions.createAccount, (state, action) => {
                state[action.payload.key] = Date.now();
            })
            .addCase(accountsActions.updateAccount, (state, action) => {
                state[action.payload.key] = Date.now();
            })
            .addCase(accountsActions.removeAccount, (state, action) => {
                action.payload.forEach(account => {
                    delete state[account.key];
                });
            });
    },
});

export const { accountRefreshed } = accountsRefreshTimeSlice.actions;
export const accountsRefreshTimeReducer = accountsRefreshTimeSlice.reducer;

export const selectAccountRefreshTime = (
    state: AccountsRefreshTimeRootState,
    accountKey: Account['key'],
): number | undefined => state.wallet.accountsRefreshTime[accountKey];
