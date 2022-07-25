import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { TimeFrameValues } from './types';

interface AppGraphState {
    selectedTimeFrame: TimeFrameValues;
}

const initialState = {
    selectedTimeFrame: 'day',
} as AppGraphState;

interface RootState {
    appGraph: AppGraphState;
}

export const appGraphSlice = createSlice({
    name: 'appGraph',
    initialState,
    reducers: {
        setSelectedTimeFrame: (state, { payload }: PayloadAction<TimeFrameValues>) => {
            console.log('set selected time frame', payload);
            state.selectedTimeFrame = payload;
        },
    },
});

export const getSelectedTimeFrame = (state: RootState) => state.appGraph.selectedTimeFrame;

export const { setSelectedTimeFrame } = appGraphSlice.actions;
export const appGraphReducer = appGraphSlice.reducer;
