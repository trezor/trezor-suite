import { createSlice } from '@reduxjs/toolkit';

type DiscoveryConfigState = {
    areTestnetsEnabled: boolean;
    discoveryStartTimeStamp: number | null;
};

type DiscoveryConfigSliceRootState = {
    discoveryConfig: DiscoveryConfigState;
};

const discoveryConfigInitialState: DiscoveryConfigState = {
    areTestnetsEnabled: false,
    discoveryStartTimeStamp: null,
};

export const discoveryConfigPersistWhitelist: Array<keyof DiscoveryConfigState> = [
    'areTestnetsEnabled',
];

export const discoveryConfigSlice = createSlice({
    name: 'discoveryConfig',
    initialState: discoveryConfigInitialState,
    reducers: {
        toggleAreTestnetsEnabled: state => {
            state.areTestnetsEnabled = !state.areTestnetsEnabled;
        },
        setDiscoveryStartTimestamp: (state, { payload }) => {
            state.discoveryStartTimeStamp = payload;
        },
    },
});

export const selectAreTestnetsEnabled = (state: DiscoveryConfigSliceRootState) =>
    state.discoveryConfig.areTestnetsEnabled;
export const selectDiscoveryStartTimeStamp = (state: DiscoveryConfigSliceRootState) =>
    state.discoveryConfig.discoveryStartTimeStamp;

export const { toggleAreTestnetsEnabled, setDiscoveryStartTimestamp } =
    discoveryConfigSlice.actions;
export const discoveryConfigReducer = discoveryConfigSlice.reducer;
