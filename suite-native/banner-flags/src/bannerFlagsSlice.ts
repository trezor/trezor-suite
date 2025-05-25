import { createSlice } from '@reduxjs/toolkit';

export interface BannerFlagsState {
    isStellarLimitedHistoryBannerClosed: boolean; // banner in account view (Overview tab) presenting limited history for Stellar
}

export type BannerFlagsSliceRootState = {
    bannerFlags: BannerFlagsState;
};

export const bannerFlagsInitialState: BannerFlagsState = {
    isStellarLimitedHistoryBannerClosed: false,
};

export const bannerFlagsSlice = createSlice({
    name: 'bannerFlags',
    initialState: bannerFlagsInitialState,
    reducers: {
        setStellarLimitedHistoryBannerClosed: state => {
            state.isStellarLimitedHistoryBannerClosed = true;
        },
    },
});

export const bannerFlagsPersistWhitelist: Array<keyof BannerFlagsState> = [
    'isStellarLimitedHistoryBannerClosed',
];

export const selectIsStellarLimitedHistoryBannerClosed = (state: BannerFlagsSliceRootState) =>
    state.bannerFlags.isStellarLimitedHistoryBannerClosed;

export const { setStellarLimitedHistoryBannerClosed } = bannerFlagsSlice.actions;

export const bannerFlagsReducer = bannerFlagsSlice.reducer;
