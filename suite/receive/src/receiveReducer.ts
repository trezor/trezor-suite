import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type ReceiveInfo } from '@suite-common/wallet-types';

export type CurrentFreshAddress = {
    path: string;
    address: string;
};

export type ReceiveState = {
    revealedAddresses: ReceiveInfo[];
    currentFreshAddress?: CurrentFreshAddress;
};

export type ReceiveRootState = {
    wallet: {
        receive: ReceiveState;
    };
};

type ReceiveActionPayload = {
    path: string;
    address: string;
};

const receiveInitialState: ReceiveState = {
    revealedAddresses: [],
    currentFreshAddress: undefined,
};

const markAddressVerified = (draft: ReceiveState, path: string, address: string) => {
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

const markAddressUnverified = (draft: ReceiveState, path: string, address: string) => {
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
        receiveDispose: () => receiveInitialState,
        showAddress: {
            reducer: (state, action: PayloadAction<ReceiveActionPayload>) => {
                markAddressVerified(state, action.payload.path, action.payload.address);
            },
            prepare: (path: string, address: string) => ({ payload: { path, address } }),
        },
        showUnverifiedAddress: {
            reducer: (state, action: PayloadAction<ReceiveActionPayload>) => {
                markAddressUnverified(state, action.payload.path, action.payload.address);
            },
            prepare: (path: string, address: string) => ({ payload: { path, address } }),
        },
        setCurrentFreshAddress: (state, action: PayloadAction<CurrentFreshAddress | undefined>) => {
            state.currentFreshAddress = action.payload;
        },
    },
});

export const selectReceiveRevealedAddresses = (state: ReceiveRootState) =>
    state.wallet.receive.revealedAddresses;

export const selectCurrentFreshAddress = (state: ReceiveRootState) =>
    state.wallet.receive.currentFreshAddress;

export const receiveActions = receiveSlice.actions;
export const receiveReducer = receiveSlice.reducer;
