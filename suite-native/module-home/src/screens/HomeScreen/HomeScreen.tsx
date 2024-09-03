import { useRef } from 'react';
import { useSelector } from 'react-redux';

import {
    selectIsEmptyDevice,
    selectIsDeviceAuthorized,
    selectDeviceAuthFailed,
    selectIsDeviceUnlocked,
} from '@suite-common/wallet-core';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';
import { Box } from '@suite-native/atoms';

import { BiometricsBottomSheet } from './components/BiometricsBottomSheet';
import { EmptyHomeRenderer } from './components/EmptyHomeRenderer';
import { PortfolioContent } from './components/PortfolioContent';
import { useHomeRefreshControl } from './useHomeRefreshControl';
import { EnableViewOnlyBottomSheet } from './components/EnableViewOnlyBottomSheet';
import { PortfolioGraphRef } from './components/PortfolioGraph';

export const HomeScreen = () => {
    const isEmptyDevice = useSelector(selectIsEmptyDevice);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isDeviceAuthFailed = useSelector(selectDeviceAuthFailed);
    const isDeviceUnlocked = useSelector(selectIsDeviceUnlocked);
    const isEmptyHomeRendererShown =
        isEmptyDevice && // There has to be no accounts and discovery not active.
        (isDeviceAuthorized || // Initial state is empty portfolio device, that is authorized.
            isDeviceAuthFailed || // When user click cancel on PIN entry or it fails from other reason.
            !isDeviceUnlocked); // When user click cancel, it takes some time before isDeviceAuthFailed is set.

    const portfolioContentRef = useRef<PortfolioGraphRef>(null);
    const refreshControl = useHomeRefreshControl({
        isEmptyDevice,
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
            <EnableViewOnlyBottomSheet />
        </Screen>
    );
};
