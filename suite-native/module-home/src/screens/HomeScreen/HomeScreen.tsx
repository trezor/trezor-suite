import React, { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import {
    selectIsDeviceAuthorized,
    selectIsDeviceInitialized,
    selectIsDeviceUnlocked,
    selectIsDiscoveredDeviceAccountless,
} from '@suite-common/wallet-core';
import { selectShouldShowSystemUnpairingAlert, useBluetoothAlerts } from '@suite-native/bluetooth';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';

import { EmptyHomeRenderer } from './components/EmptyHomeRenderer';
import { PortfolioContent } from './components/PortfolioContent';
import { PortfolioGraphRef } from './components/PortfolioGraph';
import { useHomeRefreshControl } from './useHomeRefreshControl';
import { useShowAutoEjectAlert } from './useShowAutoEjectAlert';

export const HomeScreen = () => {
    const { showSystemUnpairingAlert } = useBluetoothAlerts();

    const isDiscoveredDeviceAccountless = useSelector(selectIsDiscoveredDeviceAccountless);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isDeviceUnlocked = useSelector(selectIsDeviceUnlocked);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const shouldShowSystemUnpairingAlert = useSelector(selectShouldShowSystemUnpairingAlert);

    const isEmptyHomeRendererShown =
        (isDiscoveredDeviceAccountless && // There has to be no accounts and discovery not active.
            (isDeviceAuthorized || // Initial state is empty portfolio device, that is authorized.
                !isDeviceUnlocked)) ||
        !isDeviceInitialized;

    const portfolioContentRef = useRef<PortfolioGraphRef>(null);
    const refreshControl = useHomeRefreshControl({
        isDiscoveredDeviceAccountless,
        portfolioContentRef,
    });

    useFocusEffect(
        useCallback(() => {
            if (shouldShowSystemUnpairingAlert) {
                showSystemUnpairingAlert();
            }
        }, [shouldShowSystemUnpairingAlert, showSystemUnpairingAlert]),
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
