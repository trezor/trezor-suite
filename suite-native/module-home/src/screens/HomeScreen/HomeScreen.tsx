import { useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceDiscoveryEmpty } from '@suite-common/wallet-core';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';
import { Box } from '@suite-native/atoms';

import { BiometricsBottomSheet } from './components/BiometricsBottomSheet';
import { EmptyHomeRenderer } from './components/EmptyHomeRenderer';
import { PortfolioContent, PortfolioContentRef } from './components/PortfolioContent';
import { useHomeRefreshControl } from './useHomeRefreshControl';

export const HomeScreen = () => {
    const isDeviceDiscoveryEmpty = useSelector(selectIsDeviceDiscoveryEmpty);
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
            {isDeviceDiscoveryEmpty ? (
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
