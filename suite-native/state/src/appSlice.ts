import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type AppSliceState = {
    isAppReady: boolean;
};

type AppSliceRootState = {
    app: AppSliceState;
};

const appSliceInitialState: AppSliceState = {
    isAppReady: false,
};

export const appSlice = createSlice({
    name: 'app',
    initialState: appSliceInitialState,
    reducers: {
        setIsAppReady: (state, { payload }: PayloadAction<boolean>) => {
            state.isAppReady = payload;
        },
    },
});

export const selectIsAppReady = (state: AppSliceRootState) => state.app.isAppReady;

export const { setIsAppReady } = appSlice.actions;
export const appReducer = appSlice.reducer;
