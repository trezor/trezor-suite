import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type DeviceConnectActionPayload } from '@suite-common/device';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { DEVICE } from '@trezor/connect';

export interface BannerFlagsState {
    isStellarLimitedHistoryBannerClosed: boolean; // banner in account view (Overview tab) presenting limited history for Stellar
    isSolanaLimitedHistoryBannerClosed: boolean; // banner in account view (Overview tab) presenting limited history for Solana
    isGetTrezorBannerClosed: boolean; // promo banner on Home dashboard nudging users without a device to the eShop
    areGetTrezorPromoBannersDisabled: boolean; // permanently disabled once a physical device has ever been connected
    isOnboardingFeedbackBannerEnabled: boolean; // feedback banner on Home dashboard shown after completing device onboarding
    isDefiYieldPromoBannerClosed: boolean; // promo banner on Home dashboard nudging users to earn yield on their assets
    isEthVaultPromoBannerClosed: boolean; // promo banner on Home dashboard nudging users to earn with ETH
    isTs7PromoBannerClosed: boolean; // promo banner on Home dashboard nudging users to buy Trezor Safe 7
    closedEarnBannerSymbols: NetworkSymbol[]; // networks for which the promo earn banner in account view was closed
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
    isDefiYieldPromoBannerClosed: false,
    isEthVaultPromoBannerClosed: false,
    isTs7PromoBannerClosed: false,
    closedEarnBannerSymbols: [],
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
        setIsDefiYieldPromoBannerClosed: state => {
            state.isDefiYieldPromoBannerClosed = true;
        },
        setIsEthVaultPromoBannerClosed: state => {
            state.isEthVaultPromoBannerClosed = true;
        },
        setIsTs7PromoBannerClosed: state => {
            state.isTs7PromoBannerClosed = true;
        },
        setIsEarnBannerClosed: (state, action: PayloadAction<NetworkSymbol>) => {
            if (!state.closedEarnBannerSymbols.includes(action.payload)) {
                state.closedEarnBannerSymbols.push(action.payload);
            }
        },
    },
    extraReducers: builder => {
        builder
            .addCase(DEVICE.CONNECT, (state, action) => {
                state.areGetTrezorPromoBannersDisabled = true;

                const { device } = (action as PayloadAction<DeviceConnectActionPayload>).payload;
                if (device?.features?.internal_model === 'T3W1') {
                    // No reason to promote TS7 if already connected.
                    state.isTs7PromoBannerClosed = true;
                }
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
    'isDefiYieldPromoBannerClosed',
    'isEthVaultPromoBannerClosed',
    'isTs7PromoBannerClosed',
    'closedEarnBannerSymbols',
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

export const selectIsDefiYieldPromoBannerClosed = (state: BannerFlagsSliceRootState) =>
    state.bannerFlags.isDefiYieldPromoBannerClosed;

export const selectIsEthVaultPromoBannerClosed = (state: BannerFlagsSliceRootState) =>
    state.bannerFlags.isEthVaultPromoBannerClosed;

export const selectIsTs7PromoBannerClosed = (state: BannerFlagsSliceRootState) =>
    state.bannerFlags.isTs7PromoBannerClosed;

export const selectIsEarnBannerClosed = (state: BannerFlagsSliceRootState, symbol: NetworkSymbol) =>
    state.bannerFlags.closedEarnBannerSymbols.includes(symbol);

export const {
    setIsStellarLimitedHistoryBannerClosed,
    setIsSolanaLimitedHistoryBannerClosed,
    setIsGetTrezorBannerClosed,
    setIsOnboardingFeedbackBannerEnabled,
    setIsDefiYieldPromoBannerClosed,
    setIsEthVaultPromoBannerClosed,
    setIsTs7PromoBannerClosed,
    setIsEarnBannerClosed,
} = bannerFlagsSlice.actions;

export const bannerFlagsReducer = bannerFlagsSlice.reducer;
