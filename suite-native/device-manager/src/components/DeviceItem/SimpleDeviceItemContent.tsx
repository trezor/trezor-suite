import React, { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { selectHasOnlyEmptyPortfolioTracker } from '@suite-common/wallet-core';
import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { type NativeTypographyStyle } from '@trezor/theme';

import { DeviceConnectionStatus } from './DeviceConnectionStatus';

export type SimpleDeviceItemContentProps = {
    isConnected: boolean;
    headerTextVariant?: NativeTypographyStyle;
    header: ReactNode;
    isDeviceInBootloader: boolean;
    isPortfolioTrackerDevice: boolean;
    isSubHeaderForceHidden: boolean;
};

export const headerStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
    overflow: 'visible',
}));

export const SimpleDeviceItemContent = React.memo(
    ({
        isConnected,
        isDeviceInBootloader,
        headerTextVariant,
        header,
        isPortfolioTrackerDevice,
        isSubHeaderForceHidden,
    }: SimpleDeviceItemContentProps) => {
        const { applyStyle } = useNativeStyles();

        const hasOnlyEmptyPortfolioTracker = useSelector(selectHasOnlyEmptyPortfolioTracker);

        const isPortfolioTrackerSubHeaderVisible =
            isPortfolioTrackerDevice && !hasOnlyEmptyPortfolioTracker && !isSubHeaderForceHidden;

        const isConnectionStateVisible = !isPortfolioTrackerDevice && !hasOnlyEmptyPortfolioTracker;

        return (
            <Box>
                <Text
                    variant={headerTextVariant}
                    ellipsizeMode="tail"
                    numberOfLines={1}
                    style={applyStyle(headerStyle)}
                >
                    {hasOnlyEmptyPortfolioTracker ? (
                        <Translation id="deviceManager.defaultHeader" />
                    ) : (
                        header
                    )}
                </Text>
                <Box>
                    {isPortfolioTrackerSubHeaderVisible && (
                        <Text variant="body-sm" color="textSubdued">
                            <Translation id="deviceManager.status.portfolioTracker" />
                        </Text>
                    )}
                    {isConnectionStateVisible && (
                        <DeviceConnectionStatus
                            isConnected={isConnected}
                            isDeviceInBootloaderMode={isDeviceInBootloader}
                        />
                    )}
                </Box>
            </Box>
        );
    },
);
