import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type ReceiveInfo } from '@suite-common/wallet-types';

export type ReceiveState = ReceiveInfo[];

type ReceiveActionPayload = {
    path: string;
    address: string;
};

const receiveInitialState: ReceiveState = [];

const markAddressVerified = (draft: ReceiveState, path: string, address: string) => {
    const receiveInfo = draft.find(receive => receive.address === address);
    if (receiveInfo) {
        receiveInfo.isVerified = true;
    } else {
        draft.unshift({
            path,
            address,
            isVerified: true,
        });
    }
};

const markAddressUnverified = (draft: ReceiveState, path: string, address: string) => {
    const receiveInfo = draft.find(receive => receive.address === address);
    if (receiveInfo) {
        receiveInfo.isVerified = false;
    } else {
        draft.unshift({
            path,
            address,
            isVerified: false,
        });
    }
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
    },
});

export const receiveActions = receiveSlice.actions;
export const receiveReducer = receiveSlice.reducer;
