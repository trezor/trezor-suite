import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { TrezorDevice } from '@suite-common/suite-types';
import {
    DeviceRootState,
    selectDeviceByState,
    selectHasOnlyEmptyPortfolioTracker,
} from '@suite-common/wallet-core';
import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { NativeTypographyStyle } from '@trezor/theme';

import { DeviceConnectionStatus } from './DeviceConnectionStatus';

export type SimpleDeviceItemContentProps = {
    deviceState: TrezorDevice['state'] | undefined;
    headerTextVariant?: NativeTypographyStyle;
    header: ReactNode;
    isPortfolioTrackerDevice: boolean;
    isSubHeaderForceHidden: boolean;
};

const headerStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
    overflow: 'visible',
}));

export const SimpleDeviceItemContent = React.memo(
    ({
        deviceState,
        headerTextVariant,
        header,
        isPortfolioTrackerDevice,
        isSubHeaderForceHidden,
    }: SimpleDeviceItemContentProps) => {
        const { applyStyle } = useNativeStyles();
        const deviceIsConnected = useSelector(
            // selecting only connected device property prevents unnecessary rerenders
            (state: DeviceRootState) => selectDeviceByState(state, deviceState)?.connected,
        );
        const hasOnlyEmptyPortfolioTracker = useSelector(selectHasOnlyEmptyPortfolioTracker);

        // device not found, should not happen
        if (deviceIsConnected === undefined) {
            return null;
        }

        const isPortfolioTrackerSubHeaderVisible =
            isPortfolioTrackerDevice && !hasOnlyEmptyPortfolioTracker && !isSubHeaderForceHidden;

        const isConnectionStateVisible = !isPortfolioTrackerDevice && !hasOnlyEmptyPortfolioTracker;

        return (
            <>
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
                        <Text variant="hint" color="textSubdued">
                            <Translation id="deviceManager.status.portfolioTracker" />
                        </Text>
                    )}
                    {isConnectionStateVisible && (
                        <DeviceConnectionStatus isConnected={deviceIsConnected} />
                    )}
                </Box>
            </>
        );
    },
);
