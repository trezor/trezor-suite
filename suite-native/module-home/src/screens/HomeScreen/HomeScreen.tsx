import React, { type ForwardedRef, useCallback, useRef } from 'react';
import type { ScrollViewProps } from 'react-native';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

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
import { PortfolioContent } from './components/PortfolioContent';
import { type PortfolioGraphRef } from './components/PortfolioGraph';
import { UninitializedConnectedDeviceState } from './components/UninitializedConnectedDeviceState';
import { selectHomeScreenState } from './homescreenSelectors';
import type { HomeScreenState } from './homescreenTypes';
import { useHomeRefreshControl } from './useHomeRefreshControl';
import { useShowAutoEjectAlert } from './useShowAutoEjectAlert';

type HomeScreenContentProp = {
    homeScreenState: HomeScreenState;
    refreshControl?: ScrollViewProps['refreshControl'];
    portfolioGraphRef?: ForwardedRef<PortfolioGraphRef>;
};

const HomeScreenContent = ({
    homeScreenState,
    portfolioGraphRef,
    refreshControl,
}: HomeScreenContentProp) => {
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
            return <PortfolioContent ref={portfolioGraphRef} refreshControl={refreshControl} />;
        default:
            return exhaustive(homeScreenState);
    }
};

export const HomeScreen = () => {
    const { showSystemUnpairingAlert } = useBluetoothAlerts();
    const portfolioGraphRef = useRef<PortfolioGraphRef>(null);

    const homeScreenState = useSelector(selectHomeScreenState);
    const isDiscoveredDeviceAccountless = useSelector(selectIsDiscoveredDeviceAccountless);
    const isBluetoothDeviceOsUnpairingRequired = useSelector(
        selectIsBluetoothDeviceOsUnpairingRequired,
    );

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

    // The portfolio content owns its scrolling viewport via FlashList, so the Screen's own scroll
    // view is disabled and the refresh control is handed to the list instead. The portfolio graph
    // also needs to be rendered full width edge to edge.
    const isPortfolioContent = homeScreenState === 'portfolioContent';

    return (
        <Screen
            header={<DeviceManagerScreenHeader />}
            refreshControl={isPortfolioContent ? undefined : refreshControl}
            isScrollable={!isPortfolioContent}
            noHorizontalPadding={isPortfolioContent}
            noBottomPadding={isPortfolioContent}
            hasBottomInset={!isPortfolioContent}
        >
            <HomeScreenContent
                homeScreenState={homeScreenState}
                portfolioGraphRef={portfolioGraphRef}
                refreshControl={refreshControl}
            />
        </Screen>
    );
};
