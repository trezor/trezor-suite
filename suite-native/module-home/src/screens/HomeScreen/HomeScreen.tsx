import { useRef } from 'react';
import { useSelector } from 'react-redux';

import {
    selectIsDeviceAuthorized,
    selectDeviceAuthFailed,
    selectIsDeviceUnlocked,
    selectIsDiscoveredDeviceAccountless,
} from '@suite-common/wallet-core';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';
import { Box, HStack } from '@suite-native/atoms';
import { IconSVG, Icon } from '@suite-native/icons';

import { BiometricsBottomSheet } from './components/BiometricsBottomSheet';
import { EmptyHomeRenderer } from './components/EmptyHomeRenderer';
import { PortfolioContent } from './components/PortfolioContent';
import { useHomeRefreshControl } from './useHomeRefreshControl';
import { EnableViewOnlyBottomSheet } from './components/EnableViewOnlyBottomSheet';
import { PortfolioGraphRef } from './components/PortfolioGraph';
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

    return (
        <Screen
            screenHeader={<DeviceManagerScreenHeader hasBottomPadding />}
            refreshControl={refreshControl}
            customHorizontalPadding={0}
        >
            <HStack spacing={0}>
                <Icon name="airplaneInFlight" />
                <Icon name="starFilled" />
                <Icon name="arrowDown" />
                <Icon name="circleDashed" />
                <Icon name="star" />
                <Icon name="arrowURightDown" />
                <Icon name="starHalf" />
                <Icon name="starFour" />
                <Icon name="trezorSafe5" />
                <Icon name="trezorSafe5Filled" />
                <Icon name="trezorSafe3" />
                <Icon name="trezorSafe3Filled" />
                <Icon name="trezorModelT" />
                <Icon name="trezorModelTFilled" />
            </HStack>

            {isEmptyHomeRendererShown ? (
                <Box marginHorizontal="sp8">
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
