import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type AnyAction } from '@suite-common/redux-utils';
import { accountsActions } from '@suite-common/wallet-core';
import { type AccountKey, type ReceiveInfo } from '@suite-common/wallet-types';

export type CurrentFreshAddress = {
    path: string;
    address: string;
};

export type ReceiveAccountState = {
    revealedAddresses: ReceiveInfo[];
    currentFreshAddress?: CurrentFreshAddress;
};

export type ReceiveState = {
    accounts: Partial<Record<AccountKey, ReceiveAccountState>>;
};

export type ReceiveRootState = {
    wallet: {
        receive: ReceiveState;
    };
};

type ReceiveActionPayload = {
    accountKey: AccountKey;
    path: string;
    address: string;
};

type SetCurrentFreshAddressPayload = {
    accountKey: AccountKey;
    currentFreshAddress?: CurrentFreshAddress;
};

const receiveInitialState: ReceiveState = {
    accounts: {},
};

const emptyReceiveAccountState: ReceiveAccountState = {
    revealedAddresses: [],
    currentFreshAddress: undefined,
};

const getReceiveAccountState = (state: ReceiveState, accountKey: AccountKey) => {
    const accountState = state.accounts[accountKey];

    if (accountState) {
        return accountState;
    }

    state.accounts[accountKey] = {
        revealedAddresses: [],
        currentFreshAddress: undefined,
    };

    return state.accounts[accountKey];
};

const markAddressVerified = (draft: ReceiveAccountState, path: string, address: string) => {
    const receiveInfo = draft.revealedAddresses.find(receive => receive.address === address);
    if (receiveInfo) {
        receiveInfo.isVerified = true;
    } else {
        draft.revealedAddresses.unshift({
            path,
            address,
            isVerified: true,
        });
    }

    draft.currentFreshAddress = undefined;
};

const markAddressUnverified = (draft: ReceiveAccountState, path: string, address: string) => {
    const receiveInfo = draft.revealedAddresses.find(receive => receive.address === address);
    if (receiveInfo) {
        receiveInfo.isVerified = false;
    } else {
        draft.revealedAddresses.unshift({
            path,
            address,
            isVerified: false,
        });
    }

    draft.currentFreshAddress = undefined;
};

export const receiveSlice = createSlice({
    name: 'receive',
    initialState: receiveInitialState,
    reducers: {
        showAddress: {
            reducer: (state, action: PayloadAction<ReceiveActionPayload>) => {
                const accountState = getReceiveAccountState(state, action.payload.accountKey);

                markAddressVerified(accountState, action.payload.path, action.payload.address);
            },
            prepare: (accountKey: AccountKey, path: string, address: string) => ({
                payload: { accountKey, path, address },
            }),
        },
        showUnverifiedAddress: {
            reducer: (state, action: PayloadAction<ReceiveActionPayload>) => {
                const accountState = getReceiveAccountState(state, action.payload.accountKey);

                markAddressUnverified(accountState, action.payload.path, action.payload.address);
            },
            prepare: (accountKey: AccountKey, path: string, address: string) => ({
                payload: { accountKey, path, address },
            }),
        },
        setCurrentFreshAddress: (state, action: PayloadAction<SetCurrentFreshAddressPayload>) => {
            const accountState = getReceiveAccountState(state, action.payload.accountKey);

            accountState.currentFreshAddress = action.payload.currentFreshAddress;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(accountsActions.removeAccount, (state, action) => {
                action.payload.forEach(account => {
                    delete state.accounts[account.key];
                });
            })
            .addCase('@storage/load', (state, action) => {
                const actionWithPayload = action as AnyAction; // hack: to prevent dependency

                // We need to transform array of { key, value } from storage to the Record
                state.accounts = (
                    (actionWithPayload.payload?.receive ?? []) as {
                        key: string;
                        value: any;
                    }[]
                ).reduce<ReceiveState['accounts']>((accounts, { key, value }) => {
                    accounts[key as AccountKey] = value;

                    return accounts;
                }, {});
            });
    },
});

const selectReceiveAccountState = (state: ReceiveRootState, accountKey?: AccountKey) => {
    if (!accountKey) {
        return emptyReceiveAccountState;
    }

    return state.wallet.receive.accounts[accountKey] ?? emptyReceiveAccountState;
};

export const selectReceiveRevealedAddresses = (state: ReceiveRootState, accountKey?: AccountKey) =>
    selectReceiveAccountState(state, accountKey).revealedAddresses;

export const selectCurrentFreshAddress = (state: ReceiveRootState, accountKey?: AccountKey) =>
    selectReceiveAccountState(state, accountKey).currentFreshAddress;

export const receiveActions = receiveSlice.actions;
export const receiveReducer = receiveSlice.reducer;
