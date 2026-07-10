import { type PayloadAction } from '@reduxjs/toolkit';

import { type AnyAction, createSliceWithExtraDeps } from '@suite-common/redux-utils';
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

type PersistedReceiveAccountState = {
    touchedAddresses?: ReceiveInfo[];
    revealedAddresses?: ReceiveInfo[];
    currentFreshAddress?: CurrentFreshAddress;
};

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

    draft.currentFreshAddress = undefined;
};

export const receiveSlice = createSliceWithExtraDeps({
    name: 'receive',
    initialState: receiveInitialState,
    reducers: {
        showAddress: {
            reducer: (state, action: PayloadAction<ReceiveActionPayload>) => {
                const accountState = getReceiveAccountState(state, action.payload.accountKey);

                markAddressTouched(accountState, action.payload.path, action.payload.address);
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
    extraReducers: (builder, extra) => {
        builder
            .addCase(accountsActions.removeAccount, (state, action) => {
                action.payload.forEach((account: { key: AccountKey }) => {
                    delete state.accounts[account.key];
                });
            })
            .addCase(extra.actionTypes.storageLoad, (state, action) => {
                const actionWithPayload = action as AnyAction;

                state.accounts = (
                    (actionWithPayload.payload?.receive ?? []) as {
                        key: string;
                        value: PersistedReceiveAccountState;
                    }[]
                ).reduce<ReceiveState['accounts']>((accounts, { key, value }) => {
                    const touchedAddresses =
                        value.touchedAddresses ?? value.revealedAddresses ?? [];

                    accounts[key as AccountKey] = {
                        touchedAddresses: touchedAddresses.map(({ path, address }) => ({
                            path,
                            address,
                        })),
                        currentFreshAddress: value.currentFreshAddress,
                    };

                    return accounts;
                }, {});
            });
    },
});

const selectReceiveAccountState = (state: ReceiveRootState, accountKey?: AccountKey) => {
    if (!accountKey) {
        return emptyReceiveAccountState;
    }

    return state.receive.accounts[accountKey] ?? emptyReceiveAccountState;
};

export const selectTouchedAddresses = (state: ReceiveRootState, accountKey?: AccountKey) =>
    selectReceiveAccountState(state, accountKey).touchedAddresses;

export const selectCurrentFreshAddress = (state: ReceiveRootState, accountKey?: AccountKey) =>
    selectReceiveAccountState(state, accountKey).currentFreshAddress;

export const receiveActions = receiveSlice.actions;
export const prepareReceiveReducer = receiveSlice.prepareReducer;
