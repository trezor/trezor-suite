import React, { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import {
    selectIsDeviceAuthorized,
    selectIsDeviceInitialized,
    selectIsDeviceUnlocked,
    selectIsReconnectRequested,
} from '@suite-common/device';
import { selectIsDiscoveredDeviceAccountless } from '@suite-common/wallet-core';
import {
    selectIsBluetoothDeviceOsUnpairingRequired,
    useBluetoothAlerts,
} from '@suite-native/bluetooth';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';

import { EmptyHomeRenderer } from './components/EmptyHomeRenderer';
import { PortfolioContent } from './components/PortfolioContent';
import { type PortfolioGraphRef } from './components/PortfolioGraph';
import { useHomeRefreshControl } from './useHomeRefreshControl';
import { useShowAutoEjectAlert } from './useShowAutoEjectAlert';

export const HomeScreen = () => {
    const { showSystemUnpairingAlert } = useBluetoothAlerts();

    const isDiscoveredDeviceAccountless = useSelector(selectIsDiscoveredDeviceAccountless);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isDeviceUnlocked = useSelector(selectIsDeviceUnlocked);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isBluetoothDeviceOsUnpairingRequired = useSelector(
        selectIsBluetoothDeviceOsUnpairingRequired,
    );
    const isReconnectRequested = useSelector(selectIsReconnectRequested);

    const isEmptyHomeRendererShown =
        (isDiscoveredDeviceAccountless && // There has to be no accounts and discovery not active.
            (isDeviceAuthorized || // Initial state is empty portfolio device, that is authorized.
                !isDeviceUnlocked)) ||
        !isDeviceInitialized ||
        isReconnectRequested;

    const portfolioContentRef = useRef<PortfolioGraphRef>(null);
    const refreshControl = useHomeRefreshControl({
        isDiscoveredDeviceAccountless,
        portfolioContentRef,
    });

    useFocusEffect(
        useCallback(() => {
            if (isBluetoothDeviceOsUnpairingRequired) {
                showSystemUnpairingAlert();
            }
        }, [isBluetoothDeviceOsUnpairingRequired, showSystemUnpairingAlert]),
    );

    useShowAutoEjectAlert();

    return (
        <Screen
            header={<DeviceManagerScreenHeader />}
            refreshControl={refreshControl}
            noHorizontalPadding
        >
            {isEmptyHomeRendererShown ? (
                <EmptyHomeRenderer />
            ) : (
                <PortfolioContent ref={portfolioContentRef} />
            )}
        </Screen>
    );
};
