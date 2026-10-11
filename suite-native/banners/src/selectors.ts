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
import { type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { selectIsTradingEnabled } from '@suite-native/trading-state';
import { type TradingRootState } from '@suite-native/trading-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

import {
    type BannerFlagsSliceRootState,
    selectIsDefiYieldPromoBannerClosed,
    selectIsEthVaultPromoBannerClosed,
    selectIsTradingExperiencePromoBannerClosed,
    selectIsTs7PromoBannerClosed,
} from './bannerFlagsSlice';

type PromoBannersRootState = MessageSystemRootState &
    BannerFlagsSliceRootState &
    DeviceRootState &
    FeatureFlagsRootState &
    TradingRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<PromoBannersRootState>();

export type VisiblePromoBannerKey = 'ts7' | 'defi-yield' | 'eth-vault' | 'trading-experience';

const selectPromoBannerMessages = (state: MessageSystemRootState) =>
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

export const selectIsTs7PromoBannerDisplayed = createMemoizedSelector(
    [selectPromoBannerMessages, selectIsTs7PromoBannerClosed],
    (bannerMessages, isClosed) => isPromoBannerFeatureEnabled(bannerMessages, 'ts7') && !isClosed,
);

export const selectIsDefiYieldPromoBannerDisplayed = createMemoizedSelector(
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

export const selectIsEthVaultPromoBannerDisplayed = createMemoizedSelector(
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

export const selectIsTradingExperiencePromoBannerDisplayed = createMemoizedSelector(
    [
        selectPromoBannerMessages,
        selectIsTradingExperiencePromoBannerClosed,
        selectHasBitcoinOnlyFirmware,
        selectHasOnlyPortfolioDevice,
        selectIsTradingEnabled,
    ],
    (bannerMessages, isClosed, hasBitcoinOnlyFirmware, hasOnlyPortfolioDevice, isTradingEnabled) =>
        isPromoBannerFeatureEnabled(bannerMessages, 'trading-experience') &&
        !isClosed &&
        !hasBitcoinOnlyFirmware &&
        !hasOnlyPortfolioDevice &&
        isTradingEnabled,
);

export const selectVisiblePromoBanners = createMemoizedSelector(
    [
        selectIsTs7PromoBannerDisplayed,
        selectIsDefiYieldPromoBannerDisplayed,
        selectIsEthVaultPromoBannerDisplayed,
        selectIsTradingExperiencePromoBannerDisplayed,
    ],
    (
        isTs7PromoBannerDisplayed,
        isDefiYieldPromoBannerDisplayed,
        isEthVaultPromoBannerDisplayed,
        isTradingExperiencePromoBannerDisplayed,
    ): VisiblePromoBannerKey[] => {
        const visibleBanners: VisiblePromoBannerKey[] = [];
        if (isTs7PromoBannerDisplayed) visibleBanners.push('ts7');
        if (isDefiYieldPromoBannerDisplayed) visibleBanners.push('defi-yield');
        if (isEthVaultPromoBannerDisplayed) visibleBanners.push('eth-vault');
        if (isTradingExperiencePromoBannerDisplayed) visibleBanners.push('trading-experience');

        return visibleBanners;
    },
);
