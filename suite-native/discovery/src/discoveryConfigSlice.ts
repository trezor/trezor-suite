import { createSlice } from '@reduxjs/toolkit';

type DiscoveryConfigState = {
    areTestnetsEnabled: boolean;
};

type DiscoveryConfigSliceRootState = {
    discoveryConfig: DiscoveryConfigState;
};

const discoveryConfigInitialState: DiscoveryConfigState = {
    areTestnetsEnabled: false,
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
    },
});

export const selectAreTestnetsEnabled = (state: DiscoveryConfigSliceRootState) =>
    state.discoveryConfig.areTestnetsEnabled;

export const { toggleAreTestnetsEnabled } = discoveryConfigSlice.actions;
export const discoveryConfigReducer = discoveryConfigSlice.reducer;
