import { useSelector } from 'react-redux';
import { ReactNode } from 'react';

import { HStack, Text, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    DeviceRootState,
    selectAreAllDevicesDisconnectedOrAccountless,
    selectDeviceByState,
} from '@suite-common/wallet-core';
import { TypographyStyle } from '@trezor/theme';
import { TrezorDevice } from '@suite-common/suite-types';

import { ConnectionDot } from './ConnectionDot';

export type SimpleDeviceItemContentProps = {
    deviceState: NonNullable<TrezorDevice['state']>;
    headerTextVariant?: TypographyStyle;
    header: ReactNode;
    isPortfolioLabelDisplayed?: boolean;
    isPortfolioTrackerDevice: boolean;
};

const headerStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
    overflow: 'visible',
}));

export const SimpleDeviceItemContent = ({
    deviceState,
    headerTextVariant,
    isPortfolioLabelDisplayed,
    header,
    isPortfolioTrackerDevice,
}: SimpleDeviceItemContentProps) => {
    const { applyStyle } = useNativeStyles();
    const device = useSelector((state: DeviceRootState) => selectDeviceByState(state, deviceState));
    const areAllDevicesDisconnectedOrAccountless = useSelector(
        selectAreAllDevicesDisconnectedOrAccountless,
    );

    if (!device) {
        return null;
    }

    const isPortfolioTrackerSubHeaderVisible =
        isPortfolioTrackerDevice &&
        isPortfolioLabelDisplayed &&
        !areAllDevicesDisconnectedOrAccountless;

    const isConnectionStateVisible =
        !isPortfolioTrackerDevice && !areAllDevicesDisconnectedOrAccountless;

    return (
        <>
            <Text
                variant={headerTextVariant}
                ellipsizeMode="tail"
                numberOfLines={1}
                style={applyStyle(headerStyle)}
            >
                {areAllDevicesDisconnectedOrAccountless ? (
                    <Translation id="deviceManager.defaultHeader" />
                ) : (
                    header
                )}
            </Text>
            <Box>
                {isPortfolioTrackerSubHeaderVisible && (
                    <Text variant="label" color="textSubdued">
                        <Translation id="deviceManager.status.portfolioTracker" />
                    </Text>
                )}
                {isConnectionStateVisible && (
                    <HStack alignItems="center" spacing="small">
                        <ConnectionDot isConnected={device.connected} />
                        <Text
                            variant="hint"
                            color={device.connected ? 'textSecondaryHighlight' : 'textSubdued'}
                        >
                            <Translation
                                id={
                                    device.connected
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
};
