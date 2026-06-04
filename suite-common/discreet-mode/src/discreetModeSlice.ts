import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export type DiscreetModeState = {
    isActive: boolean;
};

const initialState: DiscreetModeState = {
    isActive: false,
};

export const discreetModeSlice = createSlice({
    name: 'discreetMode',
    initialState,
    reducers: {
        setDiscreetMode: (state, { payload }: PayloadAction<boolean>) => {
            state.isActive = payload;
        },
    },
});

export type DiscreetModeRootState = {
    discreetMode: DiscreetModeState;
};

export const discreetModeActions = discreetModeSlice.actions;
export const discreetModeReducer = discreetModeSlice.reducer;

export const discreetModePersistedWhitelist: Array<keyof DiscreetModeState> = ['isActive'];
