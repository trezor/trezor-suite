import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

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
import { UninitializedConnectedDeviceState } from './components/UninitializedConnectedDeviceState';
import { selectHomeScreenState } from './homescreenSelectors';
import type { HomeScreenState } from './homescreenTypes';
import { useShowAutoEjectAlert } from './useShowAutoEjectAlert';

type HomeScreenContentProp = {
    homeScreenState: HomeScreenState;
};

const HomeScreenContent = ({ homeScreenState }: HomeScreenContentProp) => {
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
            return <PortfolioContent />;
        default:
            return exhaustive(homeScreenState);
    }
};

export const HomeScreen = () => {
    const { showSystemUnpairingAlert } = useBluetoothAlerts();

    const homeScreenState = useSelector(selectHomeScreenState);
    const isBluetoothDeviceOsUnpairingRequired = useSelector(
        selectIsBluetoothDeviceOsUnpairingRequired,
    );

    useFocusEffect(
        useCallback(() => {
            if (isBluetoothDeviceOsUnpairingRequired) {
                showSystemUnpairingAlert();
            }
        }, [isBluetoothDeviceOsUnpairingRequired, showSystemUnpairingAlert]),
    );

    useShowAutoEjectAlert();

    // The portfolio content owns its scrolling viewport via FlashList, so the Screen's own scroll
    // view is disabled. The portfolio graph also needs to be rendered full width edge to edge.
    const isPortfolioContent = homeScreenState === 'portfolioContent';

    return (
        <Screen
            header={<DeviceManagerScreenHeader />}
            isScrollable={!isPortfolioContent}
            noHorizontalPadding={isPortfolioContent}
            noBottomPadding={isPortfolioContent}
            hasBottomInset={!isPortfolioContent}
        >
            <HomeScreenContent homeScreenState={homeScreenState} />
        </Screen>
    );
};
