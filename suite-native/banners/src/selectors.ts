import {
    type DeviceRootState,
    selectDeviceModel,
    selectHasBitcoinOnlyFirmware,
    selectHasOnlyPortfolioDevice,
} from '@suite-common/device';
import { type GeolocationRootState } from '@suite-common/geolocation';
import {
    Feature,
    type MessageSystemRootState,
    selectFeaturesConfig,
} from '@suite-common/message-system';
import {
    type BlackFridayHolidayBannerType,
    blackFridayHolidayBannerTypes,
} from '@suite-common/suite-constants';
import { type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { type LocaleSliceRootState } from '@suite-native/intl';
import { selectIsTradingEnabled } from '@suite-native/trading-state';
import { type TradingRootState } from '@suite-native/trading-types';
import { DeviceModelInternal } from '@trezor/device-utils';
import { createWeakMapSelector } from '@trezor/redux-utils';

import {
    type BannerFlagsSliceRootState,
    selectClosedHolidayPromoBannerKeys,
    selectIsDefiYieldPromoBannerClosed,
    selectIsEthVaultPromoBannerClosed,
    selectIsTradingExperiencePromoBannerClosed,
    selectIsTs7PromoBannerClosed,
} from './bannerFlagsSlice';

type PromoBannersRootState = MessageSystemRootState &
    BannerFlagsSliceRootState &
    DeviceRootState &
    FeatureFlagsRootState &
    TradingRootState &
    LocaleSliceRootState &
    GeolocationRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<PromoBannersRootState>();

export type VisiblePromoBannerKey =
    'ts7' | 'defi-yield' | 'eth-vault' | 'trading-experience' | BlackFridayHolidayBannerType;

const selectPromoBannerMessages = (state: MessageSystemRootState) =>
    selectFeaturesConfig(state, Feature.banners.dashboard.promo);

const isPromoBannerFeatureEnabled = (
    bannerMessages: ReturnType<typeof selectPromoBannerMessages>,
    visibleBanner: VisiblePromoBannerKey,
) => {
    const feature = bannerMessages
        .flatMap(m => m?.feature ?? [])
        .find(f => f.visibleBanner === visibleBanner);

    return feature?.flag === true;
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
        selectPromoBannerMessages,
        selectClosedHolidayPromoBannerKeys,
        selectDeviceModel,
        selectIsTs7PromoBannerDisplayed,
        selectIsDefiYieldPromoBannerDisplayed,
        selectIsEthVaultPromoBannerDisplayed,
        selectIsTradingExperiencePromoBannerDisplayed,
    ],
    (
        bannerMessages,
        closedHolidayBannerKeys,
        deviceModel,
        isTs7PromoBannerDisplayed,
        isDefiYieldPromoBannerDisplayed,
        isEthVaultPromoBannerDisplayed,
        isTradingExperiencePromoBannerDisplayed,
    ): VisiblePromoBannerKey[] => {
        const isSafe7 = deviceModel === DeviceModelInternal.T3W1;
        const visibleBanners: VisiblePromoBannerKey[] = blackFridayHolidayBannerTypes.filter(
            key => {
                if (
                    !isPromoBannerFeatureEnabled(bannerMessages, key) ||
                    closedHolidayBannerKeys.includes(key)
                )
                    return false;
                if (key === 'bfh26-ts7-accessory-pack' || key === 'bfh26-ts3-backup')
                    return isSafe7;
                if (key === 'bfh26-ts7-upgrade') return !isSafe7;

                return true;
            },
        );
        if (isTs7PromoBannerDisplayed) visibleBanners.push('ts7');
        if (isDefiYieldPromoBannerDisplayed) visibleBanners.push('defi-yield');
        if (isEthVaultPromoBannerDisplayed) visibleBanners.push('eth-vault');
        if (isTradingExperiencePromoBannerDisplayed) visibleBanners.push('trading-experience');

        return visibleBanners;
    },
);

export const selectHasVisiblePromoBanners = (state: PromoBannersRootState) =>
    selectVisiblePromoBanners(state).length > 0;
