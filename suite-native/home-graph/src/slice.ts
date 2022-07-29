import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { TimeFrameValues } from './types';

interface AppGraphState {
    selectedTimeFrame: TimeFrameValues;
}

const initialState: AppGraphState = {
    selectedTimeFrame: 'day',
};

interface SliceState {
    appGraph: AppGraphState;
}

export const appGraphSlice = createSlice({
    name: 'appGraph',
    initialState,
    reducers: {
        setSelectedTimeFrame: (state, { payload }: PayloadAction<TimeFrameValues>) => {
            state.selectedTimeFrame = payload;
        },
    },
});

export const getSelectedTimeFrame = (state: SliceState) => state.appGraph.selectedTimeFrame;

export const { setSelectedTimeFrame } = appGraphSlice.actions;
export const appGraphReducer = appGraphSlice.reducer;
