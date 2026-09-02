import { createSelector } from '@reduxjs/toolkit';

import { selectHasBitcoinOnlyFirmware, selectHasOnlyPortfolioDevice } from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    selectFeaturesConfig,
} from '@suite-common/message-system';

import {
    selectIsDefiYieldPromoBannerClosed,
    selectIsEthVaultPromoBannerClosed,
    selectIsTs7PromoBannerClosed,
} from './bannerFlagsSlice';

type PromoBannersRootState = MessageSystemRootState;

export type VisiblePromoBannerKey = 'ts7' | 'defi-yield' | 'eth-vault';

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

export const selectIsDefiYieldPromoBannerDisplayed = createSelector(
    [
        selectPromoBannerMessages,
        selectIsDefiYieldPromoBannerClosed,
        selectHasBitcoinOnlyFirmware,
        selectHasOnlyPortfolioDevice,
    ],
    (bannerMessages, isClosed, hasBitcoinOnlyFirmware, hasOnlyPortfolioDevice) =>
        isPromoBannerFeatureEnabled(bannerMessages, 'defi-yield') &&
        !isClosed &&
        !hasBitcoinOnlyFirmware &&
        !hasOnlyPortfolioDevice,
);

export const selectIsEthVaultPromoBannerDisplayed = createSelector(
    [
        selectPromoBannerMessages,
        selectIsEthVaultPromoBannerClosed,
        selectHasBitcoinOnlyFirmware,
        selectHasOnlyPortfolioDevice,
    ],
    (bannerMessages, isClosed, hasBitcoinOnlyFirmware, hasOnlyPortfolioDevice) =>
        isPromoBannerFeatureEnabled(bannerMessages, 'eth-vault') &&
        !isClosed &&
        !hasBitcoinOnlyFirmware &&
        !hasOnlyPortfolioDevice,
);

export const selectVisiblePromoBanners = createSelector(
    [
        selectIsTs7PromoBannerDisplayed,
        selectIsDefiYieldPromoBannerDisplayed,
        selectIsEthVaultPromoBannerDisplayed,
    ],
    (
        isTs7PromoBannerDisplayed,
        isDefiYieldPromoBannerDisplayed,
        isEthVaultPromoBannerDisplayed,
    ): VisiblePromoBannerKey[] => {
        const visibleBanners: VisiblePromoBannerKey[] = [];
        if (isTs7PromoBannerDisplayed) visibleBanners.push('ts7');
        if (isDefiYieldPromoBannerDisplayed) visibleBanners.push('defi-yield');
        if (isEthVaultPromoBannerDisplayed) visibleBanners.push('eth-vault');

        return visibleBanners;
    },
);
