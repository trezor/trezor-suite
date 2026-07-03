import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export enum TorStatus {
    Enabled = 'Enabled',
    Disabled = 'Disabled',
    Disabling = 'Disabling',
    Enabling = 'Enabling',
    Error = 'Error',
    Slow = 'Slow',
}

export interface TorBootstrap {
    current: number;
    total: number;
    isSlow?: boolean;
}

type TorState = {
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
        setTorStatus: (state, { payload }: PayloadAction<TorStatus>) => {
            state.torStatus = payload;
        },
        setTorBootstrap: (state, { payload }: PayloadAction<TorBootstrap | null>) => {
            state.torBootstrap = payload;
        },
    },
});

export type TorRootState = {
    tor: TorState;
};

export const torActions = torSlice.actions;
export type TorAction = ReturnType<(typeof torActions)[keyof typeof torActions]>;
export const torReducer = torSlice.reducer;
