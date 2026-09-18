import { Platform } from 'react-native';

import { createSelector } from '@reduxjs/toolkit';

import {
    selectHasBitcoinOnlyFirmware,
    selectHasOnlyPortfolioDevice,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    parsePromoBannerMessages,
    selectEligiblePromoBanners,
    selectFeaturesConfig,
} from '@suite-common/message-system';
import { type Account, type Discovery } from '@suite-common/wallet-types';

import {
    selectIsDefiYieldPromoBannerClosed,
    selectIsEthVaultPromoBannerClosed,
    selectIsTs7PromoBannerClosed,
} from './bannerFlagsSlice';

type PromoBannersRootState = MessageSystemRootState & {
    wallet: {
        accounts: Account[];
        discovery: Discovery;
    };
};

export type VisiblePromoBannerKey = 'ts7' | 'defi-yield' | 'eth-vault';

const nativePromoBannerPlatform = Platform.OS === 'ios' ? 'ios' : 'android';

const selectPromoBannerMessages = (state: PromoBannersRootState) =>
    selectFeaturesConfig(state, Feature.banners.dashboard.promo);

const selectPromoBannerParsingResult = createSelector([selectPromoBannerMessages], bannerMessages =>
    parsePromoBannerMessages(bannerMessages),
);

export const selectPromoBannerConfigErrors = createSelector(
    [selectPromoBannerParsingResult],
    parsingResult => parsingResult.errors,
);

const selectVisibleSelectedWalletAccounts = createSelector(
    [selectSelectedDevice, (state: PromoBannersRootState) => state.wallet.accounts],
    (selectedDevice, accounts) => {
        const selectedDeviceState = selectedDevice?.state?.staticSessionId;

        if (!selectedDeviceState) {
            return [];
        }

        return accounts.filter(
            account => account.deviceState === selectedDeviceState && account.visible,
        );
    },
);

const selectIsWalletDiscoveryFinished = createSelector(
    [selectSelectedDevice, (state: PromoBannersRootState) => state.wallet.discovery],
    (selectedDevice, discovery) => {
        const selectedDevicePath = selectedDevice?.path;

        if (!selectedDevicePath) {
            return true;
        }

        const discoveryStatus = discovery[selectedDevicePath]?.status;

        if (!discoveryStatus) {
            return true;
        }

        return (
            discoveryStatus === 'complete' ||
            discoveryStatus === 'failed' ||
            discoveryStatus === 'cancelled'
        );
    },
);

const selectLocalEligibleBannerIds = createSelector(
    [
        selectHasBitcoinOnlyFirmware,
        selectHasOnlyPortfolioDevice,
        selectSelectedDevice,
        selectIsDefiYieldPromoBannerClosed,
        selectIsEthVaultPromoBannerClosed,
        selectIsTs7PromoBannerClosed,
    ],
    (
        hasBitcoinOnlyFirmware,
        isPortfolioTrackerOnly,
        selectedDevice,
        isDefiYieldPromoBannerClosed,
        isEthVaultPromoBannerClosed,
        isTs7PromoBannerClosed,
    ): VisiblePromoBannerKey[] => {
        const visibleBanners: VisiblePromoBannerKey[] = [];

        if (!isTs7PromoBannerClosed && selectedDevice?.features?.internal_model !== 'T3W1') {
            visibleBanners.push('ts7');
        }

        if (!isDefiYieldPromoBannerClosed && !hasBitcoinOnlyFirmware && !isPortfolioTrackerOnly) {
            visibleBanners.push('defi-yield');
        }

        if (!isEthVaultPromoBannerClosed && !hasBitcoinOnlyFirmware && !isPortfolioTrackerOnly) {
            visibleBanners.push('eth-vault');
        }

        return visibleBanners;
    },
);

export const selectVisiblePromoBanners = createSelector(
    [
        selectPromoBannerParsingResult,
        selectVisibleSelectedWalletAccounts,
        selectIsWalletDiscoveryFinished,
        selectHasOnlyPortfolioDevice,
        selectSelectedDevice,
        selectLocalEligibleBannerIds,
    ],
    (
        parsingResult,
        accounts,
        isWalletDiscoveryFinished,
        isPortfolioTrackerOnly,
        selectedDevice,
        localEligibleBannerIds,
    ): VisiblePromoBannerKey[] =>
        selectEligiblePromoBanners({
            promoBanners: parsingResult.promoBanners,
            platform: nativePromoBannerPlatform,
            placement: 'home',
            accounts,
            isWalletDiscoveryFinished,
            isPortfolioTrackerOnly,
            selectedDevice,
        }).filter((bannerId): bannerId is VisiblePromoBannerKey =>
            localEligibleBannerIds.some(
                localEligibleBannerId => localEligibleBannerId === bannerId,
            ),
        ),
);
