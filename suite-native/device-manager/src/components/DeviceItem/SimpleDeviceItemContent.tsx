import { useSelector } from 'react-redux';
import React, { ReactNode } from 'react';

import { HStack, Text, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    DeviceRootState,
    selectHasOnlyEmptyPortfolioTracker,
    selectDeviceByState,
} from '@suite-common/wallet-core';
import { TypographyStyle } from '@trezor/theme';
import { TrezorDevice } from '@suite-common/suite-types';

import { ConnectionDot } from './ConnectionDot';

export type SimpleDeviceItemContentProps = {
    deviceState: NonNullable<TrezorDevice['state']>;
    headerTextVariant?: TypographyStyle;
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
            (state: DeviceRootState) => selectDeviceByState(state, deviceState)?.connected ?? null,
        );
        const hasOnlyEmptyPortfolioTracker = useSelector(selectHasOnlyEmptyPortfolioTracker);

        // device not found, should not happen
        if (deviceIsConnected === null) {
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
                        <HStack alignItems="center" spacing="small">
                            <ConnectionDot isConnected={deviceIsConnected} />
                            <Text
                                variant="hint"
                                color={deviceIsConnected ? 'textSecondaryHighlight' : 'textSubdued'}
                            >
                                <Translation
                                    id={
                                        deviceIsConnected
                                            ? 'deviceManager.status.connected'
                                            : 'deviceManager.status.disconnected'
                                    }
                                />
                            </Text>
                        </HStack>
                    )}
                </Box>
            </>
        );
    },
);
