import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type TorBootstrap, TorStatus } from '@suite/tor-types';

export type TorState = {
    torStatus: TorStatus;
    torBootstrap: TorBootstrap | null;
};

const initialState: TorState = {
    torStatus: TorStatus.Disabled,
    torBootstrap: null,
};

const torSlice = createSlice({
    name: 'tor',
    initialState,
    reducers: {
        setTorStatus: (state: TorState, { payload }: PayloadAction<TorStatus>) => {
            state.torStatus = payload;
        },
        setTorBootstrap: (state: TorState, { payload }: PayloadAction<TorBootstrap | null>) => {
            state.torBootstrap = payload;
        },
    },
});

export type TorRootState = {
    tor: TorState;
};

export const torActions = torSlice.actions;
export const torReducer = torSlice.reducer;
