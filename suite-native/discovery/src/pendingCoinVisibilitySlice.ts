import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { NetworkSymbol } from '@suite-common/wallet-config';

export type PendingCoinVisibilityState = {
    symbols: NetworkSymbol[];
};

export type PendingCoinVisibilityRootState = {
    pendingCoinVisibility: PendingCoinVisibilityState;
};

const initialState: PendingCoinVisibilityState = {
    symbols: [],
};

export const pendingCoinVisibilitySlice = createSlice({
    name: 'pendingCoinVisibility',
    initialState,
    reducers: {
        addPendingCoinVisibility: (state, { payload }: PayloadAction<NetworkSymbol>) => {
            if (!state.symbols.includes(payload)) {
                state.symbols.push(payload);
            }
        },
        clearPendingCoinVisibility: state => {
            state.symbols = [];
        },
    },
});

export const { addPendingCoinVisibility, clearPendingCoinVisibility } =
    pendingCoinVisibilitySlice.actions;

export const selectPendingCoinVisibilitySymbols = (state: PendingCoinVisibilityRootState) =>
    state.pendingCoinVisibility.symbols;
