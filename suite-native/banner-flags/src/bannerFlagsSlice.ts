import { createSlice } from '@reduxjs/toolkit';

export interface BannerFlagsState {
    isStellarLimitedHistoryBannerClosed: boolean; // banner in account view (Overview tab) presenting limited history for Stellar
    isSolanaLimitedHistoryBannerClosed: boolean; // banner in account view (Overview tab) presenting limited history for Solana
}

export type BannerFlagsSliceRootState = {
    bannerFlags: BannerFlagsState;
};

export const bannerFlagsInitialState: BannerFlagsState = {
    isStellarLimitedHistoryBannerClosed: false,
    isSolanaLimitedHistoryBannerClosed: false,
};

export const bannerFlagsSlice = createSlice({
    name: 'bannerFlags',
    initialState: bannerFlagsInitialState,
    reducers: {
        setStellarLimitedHistoryBannerClosed: state => {
            state.isStellarLimitedHistoryBannerClosed = true;
        },
        setSolanaLimitedHistoryBannerClosed: state => {
            state.isSolanaLimitedHistoryBannerClosed = true;
        },
    },
});

export const bannerFlagsPersistWhitelist: Array<keyof BannerFlagsState> = [
    'isStellarLimitedHistoryBannerClosed',
    'isSolanaLimitedHistoryBannerClosed',
];

export const selectIsStellarLimitedHistoryBannerClosed = (state: BannerFlagsSliceRootState) =>
    state.bannerFlags.isStellarLimitedHistoryBannerClosed;

export const { setStellarLimitedHistoryBannerClosed } = bannerFlagsSlice.actions;

export const selectIsSolanaLimitedHistoryBannerClosed = (state: BannerFlagsSliceRootState) =>
    state.bannerFlags.isSolanaLimitedHistoryBannerClosed;

export const { setSolanaLimitedHistoryBannerClosed } = bannerFlagsSlice.actions;

export const bannerFlagsReducer = bannerFlagsSlice.reducer;
