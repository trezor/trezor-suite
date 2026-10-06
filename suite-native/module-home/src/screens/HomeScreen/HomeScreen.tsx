import React, { type Ref, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { ExperimentId, useIsExperimentVariantActive } from '@suite-common/message-system';
import { selectIsDiscoveredDeviceAccountless } from '@suite-common/wallet-core';
import {
    selectIsBluetoothDeviceOsUnpairingRequired,
    useBluetoothAlerts,
} from '@suite-native/bluetooth';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

import { DiscoveryNotFinished } from './components/DiscoveryNotFinished';
import { EmptyPortfolioCrossroads } from './components/EmptyPortfolioCrossroads';
import { EmptyPortfolioTrackerState } from './components/EmptyPortfolioTrackerState';
import { NoNetworksConfigured } from './components/NoNetworksConfigured';
import { PortfolioAssetsContent } from './components/PortfolioAssets/PortfolioAssetsContent';
import { PortfolioContent as LegacyPortfolioContent } from './components/PortfolioContent';
import { type PortfolioGraphRef } from './components/PortfolioGraph';
import { UninitializedConnectedDeviceState } from './components/UninitializedConnectedDeviceState';
import { selectHomeScreenState } from './homescreenSelectors';
import { type HomeScreenState } from './homescreenTypes';
import { useHomeRefreshControl } from './useHomeRefreshControl';
import { useShowAutoEjectAlert } from './useShowAutoEjectAlert';

type HomeScreenContentProps = {
    homeScreenState: HomeScreenState;
    portfolioGraphRef: Ref<PortfolioGraphRef | null>;
    isAssetsFirstHomeScreenEnabled: boolean;
};

const HomeScreenContent = ({
    homeScreenState,
    portfolioGraphRef,
    isAssetsFirstHomeScreenEnabled,
}: HomeScreenContentProps) => {
    switch (homeScreenState) {
        case 'emptyPortfolioCrossroads':
            return <EmptyPortfolioCrossroads />;
        case 'emptyPortfolioTracker':
            return <EmptyPortfolioTrackerState />;
        case 'uninitializedDevice':
            return <UninitializedConnectedDeviceState />;
        case 'noNetworkConfigured':
            return <NoNetworksConfigured />;
        case 'discoveryNotFinished':
            return <DiscoveryNotFinished />;
        case 'portfolioContent':
            return isAssetsFirstHomeScreenEnabled ? (
                <PortfolioAssetsContent />
            ) : (
                <LegacyPortfolioContent ref={portfolioGraphRef} />
            );
        default:
            return exhaustive(homeScreenState);
    }
};

export const HomeScreen = () => {
    const { showSystemUnpairingAlert } = useBluetoothAlerts();
    const isAssetsFirstHomeScreenEnabled = useIsExperimentVariantActive({
        experimentId: ExperimentId.assetFirstHomeTable,
        variant: 'B',
    });
    const portfolioGraphRef = useRef<PortfolioGraphRef>(null);

    const homeScreenState = useSelector(selectHomeScreenState);
    const isDiscoveredDeviceAccountless = useSelector(selectIsDiscoveredDeviceAccountless);
    const isBluetoothDeviceOsUnpairingRequired = useSelector(
        selectIsBluetoothDeviceOsUnpairingRequired,
    );
    const isAssetsFirstHomeScreenVisible =
        homeScreenState === 'portfolioContent' && isAssetsFirstHomeScreenEnabled;

    const refreshControl = useHomeRefreshControl({
        isDiscoveredDeviceAccountless,
        portfolioGraphRef,
    });

    useFocusEffect(
        useCallback(() => {
            if (isBluetoothDeviceOsUnpairingRequired) {
                showSystemUnpairingAlert();
            }
        }, [isBluetoothDeviceOsUnpairingRequired, showSystemUnpairingAlert]),
    );

    useShowAutoEjectAlert();

    const doesHomeContentHandleHorizontalPadding = homeScreenState === 'portfolioContent';

    return (
        <Screen
            header={<DeviceManagerScreenHeader />}
            refreshControl={isAssetsFirstHomeScreenVisible ? undefined : refreshControl}
            isScrollable={!isAssetsFirstHomeScreenVisible}
            noHorizontalPadding={doesHomeContentHandleHorizontalPadding}
        >
            <HomeScreenContent
                homeScreenState={homeScreenState}
                portfolioGraphRef={portfolioGraphRef}
                isAssetsFirstHomeScreenEnabled={isAssetsFirstHomeScreenEnabled}
            />
        </Screen>
    );
};
