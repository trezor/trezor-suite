import React, { type Ref, useCallback, useRef } from 'react';
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
import { type HomeScreenState } from './homescreenTypes';
import { useHomeRefreshControl } from './useHomeRefreshControl';
import { useShowAutoEjectAlert } from './useShowAutoEjectAlert';

const HomeScreenContent = ({
    homeScreenState,
    portfolioGraphRef,
}: {
    homeScreenState: HomeScreenState;
    portfolioGraphRef: Ref<PortfolioGraphRef | null>;
}) => {
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
            return <PortfolioContent ref={portfolioGraphRef} />;
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

    // Portfolio graph needs to be rendered full width edge to edge.
    const isFullWidthScreenState = homeScreenState === 'portfolioContent';

    return (
        <Screen
            header={<DeviceManagerScreenHeader />}
            refreshControl={refreshControl}
            noHorizontalPadding={isFullWidthScreenState}
        >
            <HomeScreenContent
                homeScreenState={homeScreenState}
                portfolioGraphRef={portfolioGraphRef}
            />
        </Screen>
    );
};
