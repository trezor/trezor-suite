import { type PayloadAction } from '@reduxjs/toolkit';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';
import { DEVICE } from '@trezor/connect';

import { type NewContentIndicatorId } from './flagsConstants';

export type FlagsState = {
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
    showOnboardingFeedbackBanner: boolean;
    showSettingsDesktopAppPromoBanner: boolean;
    activateAssetsBannerClosed: boolean;
    stakeEthBannerClosed: boolean;
    earnEthBannerClosed: boolean;
    stakeSolBannerClosed: boolean;
    stakeCardanoBannerClosed: boolean;
    stakeTronBannerClosed: boolean;
    showDashboardStakingPromoBanner: boolean;
    suspiciousTransactionsTooltipClosed: boolean;
    showUnhideTokenModal: boolean;
    showCopyAddressModal: boolean;
    enableAutoupdateOnNextRun: boolean;
    showBluetoothDebugInfo: boolean;
    stellarLimitedHistoryBannerClosed: boolean;
    solanaLimitedHistoryBannerClosed: boolean;
    hasSeenDisconnectTooltip: boolean;
    showNoDeviceEshopSidebarBanner: boolean;
    areNoDeviceEshopBannersDisabled: boolean;
    seenNewContentIndicators: Partial<Record<NewContentIndicatorId, true>>;
};

export type FlagsRootState = { flags: FlagsState };

export type BooleanFlagKey = {
    [Key in keyof FlagsState]: FlagsState[Key] extends boolean ? Key : never;
}[keyof FlagsState];

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
    showOnboardingFeedbackBanner: false,
    showSettingsDesktopAppPromoBanner: true,
    activateAssetsBannerClosed: false,
    stakeEthBannerClosed: false,
    earnEthBannerClosed: false,
    stakeSolBannerClosed: false,
    stakeCardanoBannerClosed: false,
    stakeTronBannerClosed: false,
    showDashboardStakingPromoBanner: true,
    suspiciousTransactionsTooltipClosed: false,
    showCopyAddressModal: true,
    showUnhideTokenModal: true,
    enableAutoupdateOnNextRun: false,
    showBluetoothDebugInfo: false,
    stellarLimitedHistoryBannerClosed: false,
    solanaLimitedHistoryBannerClosed: false,
    hasSeenDisconnectTooltip: false,
    showNoDeviceEshopSidebarBanner: true,
    areNoDeviceEshopBannersDisabled: false,
    seenNewContentIndicators: {},
};

const flagsSlice = createSliceWithExtraDeps({
    name: 'flags',
    initialState: flagsInitialState,
    reducers: {
        setFlag: (
            state: FlagsState,
            { payload }: PayloadAction<{ key: BooleanFlagKey; value: boolean }>,
        ) => {
            state[payload.key] = payload.value;
        },
        markNewContentIndicatorAsSeen: (
            state: FlagsState,
            { payload }: PayloadAction<NewContentIndicatorId>,
        ) => {
            state.seenNewContentIndicators[payload] = true;
        },
        setNewContentIndicatorSeen: (
            state: FlagsState,
            { payload }: PayloadAction<{ indicatorId: NewContentIndicatorId; isSeen: boolean }>,
        ) => {
            if (payload.isSeen) {
                state.seenNewContentIndicators[payload.indicatorId] = true;
            } else {
                delete state.seenNewContentIndicators[payload.indicatorId];
            }
        },
    },
    extraReducers: (builder, extra) => {
        builder
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadFlags)
            .addCase(DEVICE.CONNECT, state => {
                state.areNoDeviceEshopBannersDisabled = true;
            })
            .addCase(DEVICE.CONNECT_UNACQUIRED, state => {
                state.areNoDeviceEshopBannersDisabled = true;
            });
    },
});

export const { markNewContentIndicatorAsSeen, setFlag, setNewContentIndicatorSeen } =
    flagsSlice.actions;
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
export const selectIsOnboardingFeedbackBannerShown = (state: FlagsRootState) =>
    state.flags.showOnboardingFeedbackBanner;
export const selectIsSettingsDesktopAppPromoBannerShown = (state: FlagsRootState) =>
    state.flags.showSettingsDesktopAppPromoBanner;
export const selectIsActivateAssetsBannerClosed = (state: FlagsRootState) =>
    state.flags.activateAssetsBannerClosed;
export const selectIsUnhideTokenModalShown = (state: FlagsRootState) =>
    state.flags.showUnhideTokenModal;
export const selectIsCopyAddressModalShown = (state: FlagsRootState) =>
    state.flags.showCopyAddressModal;
export const selectIsNoDeviceEshopSidebarBannerShown = (state: FlagsRootState) =>
    state.flags.showNoDeviceEshopSidebarBanner;
export const selectAreNoDeviceEshopBannersDisabled = (state: FlagsRootState) =>
    state.flags.areNoDeviceEshopBannersDisabled;
export const selectIsNewContentIndicatorVisible =
    (indicatorId: NewContentIndicatorId) => (state: FlagsRootState) =>
        state.flags.seenNewContentIndicators[indicatorId] !== true;
