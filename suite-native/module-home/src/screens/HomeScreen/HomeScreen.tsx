import React, { useRef } from 'react';
import { useSelector } from 'react-redux';

import {
    selectDeviceAuthFailed,
    selectIsDeviceAuthorized,
    selectIsDeviceUnlocked,
    selectIsDiscoveredDeviceAccountless,
} from '@suite-common/wallet-core';
import { Box } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';

import { useShowBiometricsAlert } from './useShowBiometricsAlert';
import { EmptyHomeRenderer } from './components/EmptyHomeRenderer';
import { PortfolioContent } from './components/PortfolioContent';
import { useHomeRefreshControl } from './useHomeRefreshControl';
import { PortfolioGraphRef } from './components/PortfolioGraph';
import { useShowViewOnlyAlert } from './useShowViewOnlyAlert';
export const HomeScreen = () => {
    const isDiscoveredDeviceAccountless = useSelector(selectIsDiscoveredDeviceAccountless);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isDeviceAuthFailed = useSelector(selectDeviceAuthFailed);
    const isDeviceUnlocked = useSelector(selectIsDeviceUnlocked);
    const isEmptyHomeRendererShown =
        isDiscoveredDeviceAccountless && // There has to be no accounts and discovery not active.
        (isDeviceAuthorized || // Initial state is empty portfolio device, that is authorized.
            isDeviceAuthFailed || // When user click cancel on PIN entry or it fails from other reason.
            !isDeviceUnlocked); // When user click cancel, it takes some time before isDeviceAuthFailed is set.

    const portfolioContentRef = useRef<PortfolioGraphRef>(null);
    const refreshControl = useHomeRefreshControl({
        isDiscoveredDeviceAccountless,
        portfolioContentRef,
    });

    useShowBiometricsAlert();
    useShowViewOnlyAlert();

    return (
        <Screen
            screenHeader={<DeviceManagerScreenHeader hasBottomPadding />}
            refreshControl={refreshControl}
            customHorizontalPadding={0}
        >
            {isEmptyHomeRendererShown ? (
                <Box marginHorizontal="sp16" marginBottom="sp8">
                    <EmptyHomeRenderer />
                </Box>
            ) : (
                <PortfolioContent ref={portfolioContentRef} />
            )}
        </Screen>
    );
};
