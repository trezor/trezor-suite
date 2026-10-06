import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export type DiscreetModeState = {
    isActive: boolean;
};

type StorageLoadDiscreetModeAction = PayloadAction<{
    discreetMode?: DiscreetModeState;
}>;

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
    extraReducers: builder => {
        // hack: to prevent dependency
        builder.addCase('@storage/load', (state, action) => {
            const { payload } = action as StorageLoadDiscreetModeAction;
            if (payload?.discreetMode) {
                return { ...state, ...payload.discreetMode };
            }

            return state;
        });
    },
});

export type DiscreetModeRootState = {
    discreetMode: DiscreetModeState;
};

export const discreetModeActions = discreetModeSlice.actions;
export const discreetModeReducer = discreetModeSlice.reducer;

export const selectDiscreetMode = (state: DiscreetModeRootState) => state.discreetMode;
export const selectIsDiscreteModeActive = (state: DiscreetModeRootState) =>
    state.discreetMode.isActive;
