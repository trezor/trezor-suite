import { type PayloadAction } from '@reduxjs/toolkit';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';

export interface FlagsState {
    initialRun: boolean;
    taprootBannerClosed: boolean;
    firmwareTypeBannerClosed: boolean;
    discreetModeCompleted: boolean;
    securityStepsHidden: boolean;
    dashboardGraphHidden: boolean;
    dashboardAssetsGridMode: boolean;
    showTEXDashboardPromoBanner: boolean;
    showTS7DashboardPromoBanner: boolean;
    showStablecoinYieldDashboardPromoBanner: boolean;
    showSettingsDesktopAppPromoBanner: boolean;
    activateAssetsBannerClosed: boolean;
    stakeEthBannerClosed: boolean;
    stakeSolBannerClosed: boolean;
    stakeCardanoBannerClosed: boolean;
    showDashboardStakingPromoBanner: boolean;
    suspiciousTransactionsTooltipClosed: boolean;
    showUnhideTokenModal: boolean;
    showCopyAddressModal: boolean;
    enableAutoupdateOnNextRun: boolean;
    showBluetoothDebugInfo: boolean;
    stellarLimitedHistoryBannerClosed: boolean;
    solanaLimitedHistoryBannerClosed: boolean;
    hasSeenDisconnectTooltip: boolean;
}

export type FlagsRootState = { flags: FlagsState };

export const flagsInitialState: FlagsState = {
    initialRun: true,
    discreetModeCompleted: false,
    taprootBannerClosed: false,
    firmwareTypeBannerClosed: false,
    securityStepsHidden: false,
    dashboardGraphHidden: false,
    dashboardAssetsGridMode: true,
    showTEXDashboardPromoBanner: true,
    showTS7DashboardPromoBanner: true,
    showStablecoinYieldDashboardPromoBanner: true,
    showSettingsDesktopAppPromoBanner: true,
    activateAssetsBannerClosed: false,
    stakeEthBannerClosed: false,
    stakeSolBannerClosed: false,
    stakeCardanoBannerClosed: false,
    showDashboardStakingPromoBanner: true,
    suspiciousTransactionsTooltipClosed: false,
    showCopyAddressModal: true,
    showUnhideTokenModal: true,
    enableAutoupdateOnNextRun: false,
    showBluetoothDebugInfo: false,
    stellarLimitedHistoryBannerClosed: false,
    solanaLimitedHistoryBannerClosed: false,
    hasSeenDisconnectTooltip: false,
};

const flagsSlice = createSliceWithExtraDeps({
    name: 'flags',
    initialState: flagsInitialState,
    reducers: {
        setFlag: (state, { payload }: PayloadAction<{ key: keyof FlagsState; value: boolean }>) => {
            state[payload.key] = payload.value;
        },
    },
    extraReducers: (builder, extra) => {
        builder.addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadFlags);
    },
});

export const { setFlag } = flagsSlice.actions;
export const flagsActions = flagsSlice.actions;
export const prepareFlagsReducer = flagsSlice.prepareReducer;

export const selectFlags = (state: FlagsRootState) => state.flags;
export const selectIsInitialRun = (state: FlagsRootState) => state.flags.initialRun;
export const selectIsTEXDashboardPromoBannerShown = (state: FlagsRootState) =>
    state.flags.showTEXDashboardPromoBanner;
export const selectIsTS7DashboardPromoBannerShown = (state: FlagsRootState) =>
    state.flags.showTS7DashboardPromoBanner;
export const selectIsStablecoinYieldDashboardPromoBannerShown = (state: FlagsRootState) =>
    state.flags.showStablecoinYieldDashboardPromoBanner;
export const selectIsSettingsDesktopAppPromoBannerShown = (state: FlagsRootState) =>
    state.flags.showSettingsDesktopAppPromoBanner;
export const selectIsActivateAssetsBannerClosed = (state: FlagsRootState) =>
    state.flags.activateAssetsBannerClosed;
export const selectIsUnhideTokenModalShown = (state: FlagsRootState) =>
    state.flags.showUnhideTokenModal;
export const selectIsCopyAddressModalShown = (state: FlagsRootState) =>
    state.flags.showCopyAddressModal;
