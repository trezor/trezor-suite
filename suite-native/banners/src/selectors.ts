import { createSelector } from '@reduxjs/toolkit';

import {
    type DeviceRootState,
    selectHasBitcoinOnlyFirmware,
    selectHasOnlyPortfolioDevice,
} from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    selectFeaturesConfig,
} from '@suite-common/message-system';

import {
    type BannerFlagsSliceRootState,
    selectIsStablecoinYieldPromoBannerClosed,
    selectIsTs7PromoBannerClosed,
} from './bannerFlagsSlice';

type PromoBannersRootState = MessageSystemRootState & BannerFlagsSliceRootState & DeviceRootState;

export type VisiblePromoBannerKey = 'ts7' | 'stablecoin-yield';

const selectPromoBannerMessages = (state: PromoBannersRootState) =>
    selectFeaturesConfig(state, Feature.banners.dashboard.promo);

const isPromoBannerFeatureEnabled = (
    bannerMessages: ReturnType<typeof selectPromoBannerMessages>,
    visibleBanner: VisiblePromoBannerKey,
) => {
    const feature = bannerMessages
        .flatMap(m => m?.feature ?? [])
        .find(f => f.visibleBanner === visibleBanner);

    return feature?.flag ?? true;
};

export const selectIsTs7PromoBannerDisplayed = createSelector(
    [selectPromoBannerMessages, selectIsTs7PromoBannerClosed],
    (bannerMessages, isClosed) => isPromoBannerFeatureEnabled(bannerMessages, 'ts7') && !isClosed,
);

export const selectIsStablecoinYieldPromoBannerDisplayed = createSelector(
    [
        selectPromoBannerMessages,
        selectIsStablecoinYieldPromoBannerClosed,
        selectHasBitcoinOnlyFirmware,
        selectHasOnlyPortfolioDevice,
    ],
    (bannerMessages, isClosed, hasBitcoinOnlyFirmware, hasOnlyPortfolioDevice) =>
        isPromoBannerFeatureEnabled(bannerMessages, 'stablecoin-yield') &&
        !isClosed &&
        !hasBitcoinOnlyFirmware &&
        !hasOnlyPortfolioDevice,
);

export const selectVisiblePromoBanners = createSelector(
    [selectIsTs7PromoBannerDisplayed, selectIsStablecoinYieldPromoBannerDisplayed],
    (isTs7PromoBannerDisplayed, isStablecoinYieldPromoBannerDisplayed): VisiblePromoBannerKey[] => {
        const visibleBanners: VisiblePromoBannerKey[] = [];
        if (isTs7PromoBannerDisplayed) visibleBanners.push('ts7');
        if (isStablecoinYieldPromoBannerDisplayed) visibleBanners.push('stablecoin-yield');

        return visibleBanners;
    },
);
