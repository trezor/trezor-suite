import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { DEVICE } from '@trezor/connect';

export interface BannerFlagsState {
    isStellarLimitedHistoryBannerClosed: boolean; // banner in account view (Overview tab) presenting limited history for Stellar
    isSolanaLimitedHistoryBannerClosed: boolean; // banner in account view (Overview tab) presenting limited history for Solana
    isGetTrezorBannerClosed: boolean; // promo banner on Home dashboard nudging users without a device to the eShop
    areGetTrezorPromoBannersDisabled: boolean; // permanently disabled once a physical device has ever been connected
    isOnboardingFeedbackBannerEnabled: boolean; // feedback banner on Home dashboard shown after completing device onboarding
}

export type BannerFlagsSliceRootState = {
    bannerFlags: BannerFlagsState;
};

export const bannerFlagsInitialState: BannerFlagsState = {
    isStellarLimitedHistoryBannerClosed: false,
    isSolanaLimitedHistoryBannerClosed: false,
    isGetTrezorBannerClosed: false,
    areGetTrezorPromoBannersDisabled: false,
    isOnboardingFeedbackBannerEnabled: false,
};

export const bannerFlagsSlice = createSlice({
    name: 'bannerFlags',
    initialState: bannerFlagsInitialState,
    reducers: {
        setIsStellarLimitedHistoryBannerClosed: state => {
            state.isStellarLimitedHistoryBannerClosed = true;
        },
        setIsSolanaLimitedHistoryBannerClosed: state => {
            state.isSolanaLimitedHistoryBannerClosed = true;
        },
        setIsGetTrezorBannerClosed: state => {
            state.isGetTrezorBannerClosed = true;
        },
        setIsOnboardingFeedbackBannerEnabled: (state, action: PayloadAction<boolean>) => {
            state.isOnboardingFeedbackBannerEnabled = action.payload;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(DEVICE.CONNECT, state => {
                state.areGetTrezorPromoBannersDisabled = true;
            })
            .addCase(DEVICE.CONNECT_UNACQUIRED, state => {
                state.areGetTrezorPromoBannersDisabled = true;
            });
    },
});

export const bannerFlagsPersistWhitelist: Array<keyof BannerFlagsState> = [
    'isStellarLimitedHistoryBannerClosed',
    'isSolanaLimitedHistoryBannerClosed',
    'isGetTrezorBannerClosed',
    'areGetTrezorPromoBannersDisabled',
    'isOnboardingFeedbackBannerEnabled',
];

export const selectIsStellarLimitedHistoryBannerClosed = (state: BannerFlagsSliceRootState) =>
    state.bannerFlags.isStellarLimitedHistoryBannerClosed;

export const selectIsSolanaLimitedHistoryBannerClosed = (state: BannerFlagsSliceRootState) =>
    state.bannerFlags.isSolanaLimitedHistoryBannerClosed;

export const selectIsGetTrezorBannerClosed = (state: BannerFlagsSliceRootState) =>
    state.bannerFlags.isGetTrezorBannerClosed;

export const selectAreGetTrezorPromoBannersDisabled = (state: BannerFlagsSliceRootState) =>
    state.bannerFlags.areGetTrezorPromoBannersDisabled;

export const selectIsOnboardingFeedbackBannerEnabled = (state: BannerFlagsSliceRootState) =>
    state.bannerFlags.isOnboardingFeedbackBannerEnabled;

export const {
    setIsStellarLimitedHistoryBannerClosed,
    setIsSolanaLimitedHistoryBannerClosed,
    setIsGetTrezorBannerClosed,
    setIsOnboardingFeedbackBannerEnabled,
} = bannerFlagsSlice.actions;

export const bannerFlagsReducer = bannerFlagsSlice.reducer;
