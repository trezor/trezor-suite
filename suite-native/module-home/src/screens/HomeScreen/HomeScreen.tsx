import { useRef } from 'react';
import { useSelector } from 'react-redux';

import {
    selectIsDeviceDiscoveryEmpty,
    selectIsDeviceAuthorized,
    selectDeviceAuthFailed,
    selectIsDeviceUnlocked,
} from '@suite-common/wallet-core';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';
import { Box } from '@suite-native/atoms';

import { BiometricsBottomSheet } from './components/BiometricsBottomSheet';
import { EmptyHomeRenderer } from './components/EmptyHomeRenderer';
import { PortfolioContent, PortfolioContentRef } from './components/PortfolioContent';
import { useHomeRefreshControl } from './useHomeRefreshControl';

export const HomeScreen = () => {
    const isDeviceDiscoveryEmpty = useSelector(selectIsDeviceDiscoveryEmpty);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isDeviceAuthFailed = useSelector(selectDeviceAuthFailed);
    const isDeviceUnlocked = useSelector(selectIsDeviceUnlocked);
    const isEmptyHomeRendererShown =
        isDeviceDiscoveryEmpty && // There has to be no accounts and discovery not active.
        (isDeviceAuthorized || // Initial state is empty portfolio device, that is authorized.
            isDeviceAuthFailed || // When user click cancel on PIN entry or it fails from other reason.
            !isDeviceUnlocked); // When user click cancel, it takes some time before isDeviceAuthFailed is set.

    const portfolioContentRef = useRef<PortfolioContentRef>(null);
    const refreshControl = useHomeRefreshControl({
        isPortfolioEmpty: isDeviceDiscoveryEmpty,
        portfolioContentRef,
    });

    return (
        <Screen
            screenHeader={<DeviceManagerScreenHeader hasBottomPadding />}
            refreshControl={refreshControl}
            customHorizontalPadding={0}
        >
            {isEmptyHomeRendererShown ? (
                <Box marginHorizontal="small">
                    <EmptyHomeRenderer />
                </Box>
            ) : (
                <PortfolioContent ref={portfolioContentRef} />
            )}
            <BiometricsBottomSheet />
        </Screen>
    );
};
