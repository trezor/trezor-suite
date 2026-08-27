import { type PayloadAction } from '@reduxjs/toolkit';

import {
    type ActionTypesDep,
    type ReducersDep,
    createSliceWithExtraDeps,
    createWeakMapSelector,
} from '@suite-common/redux-utils';
import { accountsActions } from '@suite-common/wallet-core';
import { type AccountKey, type ReceiveInfo } from '@suite-common/wallet-types';

export type CurrentFreshAddress = {
    path: string;
    address: string;
};

export type ReceiveAccountState = {
    touchedAddresses: ReceiveInfo[];
    currentFreshAddress?: CurrentFreshAddress;
};

export type ReceiveState = {
    accounts: Partial<Record<AccountKey, ReceiveAccountState>>;
};

export type ReceiveRootState = {
    receive: ReceiveState;
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

export type ReceiveSliceDeps = ActionTypesDep<'storageLoad'> &
    ReducersDep<'storageLoadReceiveAccounts'>;

export const receiveInitialState: ReceiveState = {
    accounts: {},
};

const emptyReceiveAccountState: ReceiveAccountState = {
    touchedAddresses: [],
    currentFreshAddress: undefined,
};

const getReceiveAccountState = (state: ReceiveState, accountKey: AccountKey) => {
    const accountState = state.accounts[accountKey];

    if (accountState) {
        return accountState;
    }

    state.accounts[accountKey] = {
        touchedAddresses: [],
        currentFreshAddress: undefined,
    };

    return state.accounts[accountKey];
};

const markAddressTouched = (draft: ReceiveAccountState, path: string, address: string) => {
    const receiveInfo = draft.touchedAddresses.find(receive => receive.address === address);
    if (!receiveInfo) {
        draft.touchedAddresses.unshift({
            path,
            address,
        });
    }
};

const receiveSlice = createSliceWithExtraDeps({
    name: 'receive',
    initialState: receiveInitialState,
    reducers: {
        showAddress: (state, action: PayloadAction<ReceiveActionPayload>) => {
            const accountState = getReceiveAccountState(state, action.payload.accountKey);

            markAddressTouched(accountState, action.payload.path, action.payload.address);
            accountState.currentFreshAddress = undefined;
        },
        touchAddress: (state, action: PayloadAction<ReceiveActionPayload>) => {
            const accountState = getReceiveAccountState(state, action.payload.accountKey);

            markAddressTouched(accountState, action.payload.path, action.payload.address);
        },
        setCurrentFreshAddress: (state, action: PayloadAction<SetCurrentFreshAddressPayload>) => {
            const accountState = getReceiveAccountState(state, action.payload.accountKey);

            accountState.currentFreshAddress = action.payload.currentFreshAddress;
        },
    },
    extraReducers: (builder, extra: ReceiveSliceDeps) => {
        builder
            .addCase(accountsActions.removeAccount, (state, action) => {
                action.payload.forEach((account: { key: AccountKey }) => {
                    delete state.accounts[account.key];
                });
            })
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadReceiveAccounts);
    },
});

const createMemoizedSelector = createWeakMapSelector.withTypes<ReceiveRootState>();

const selectReceiveAccountState = (state: ReceiveRootState, accountKey?: AccountKey) =>
    accountKey ? state.receive.accounts[accountKey] : undefined;

export const selectTouchedAddresses = createMemoizedSelector(
    [selectReceiveAccountState],
    accountState => accountState?.touchedAddresses ?? emptyReceiveAccountState.touchedAddresses,
);

export const selectCurrentFreshAddress = createMemoizedSelector(
    [selectReceiveAccountState],
    accountState => accountState?.currentFreshAddress,
);

export const receiveActions = receiveSlice.actions;
export const prepareReceiveReducer = receiveSlice.prepareReducer;
