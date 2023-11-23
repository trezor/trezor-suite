import React from 'react';
import { useSelector } from 'react-redux';

import { Icon, IconName } from '@suite-common/icons';
import { HStack, Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    selectDeviceNameById,
    DeviceRootState,
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectDeviceLabelById,
} from '@suite-common/wallet-core';
import { TrezorDevice } from '@suite-common/suite-types';
import { TypographyStyle } from '@trezor/theme';
import { useActiveColorScheme } from '@suite-native/theme';

type Props = {
    deviceId: TrezorDevice['id'];
    isPortfolioLabelDisplayed?: boolean;
    deviceNameTextVariant?: TypographyStyle;
};

export const DeviceItemContent = ({
    deviceId,
    isPortfolioLabelDisplayed = true,
    deviceNameTextVariant = 'body',
}: Props) => {
    const activeColorScheme = useActiveColorScheme();

    const deviceName = useSelector((state: DeviceRootState) =>
        selectDeviceNameById(state, deviceId),
    );
    const deviceLabel = useSelector((state: DeviceRootState) =>
        selectDeviceLabelById(state, deviceId),
    );

    const isPortfolioTrackerDevice = deviceId === PORTFOLIO_TRACKER_DEVICE_ID;

    // TODO: when we enable remember mode, icon representing disconnected device have to be handled.
    const trezorDeviceIcon: IconName =
        activeColorScheme === 'standard' ? 'trezorConnectedLight' : 'trezorConnectedDark';

    return (
        <HStack alignItems="center" spacing="medium">
            {isPortfolioTrackerDevice ? (
                <Icon name="database" color="iconDefault" />
            ) : (
                <Icon name={trezorDeviceIcon} color="svgSource" />
            )}
            <Box>
                <Text variant={deviceNameTextVariant}>
                    {(isPortfolioTrackerDevice ? deviceName : deviceLabel) ?? deviceName}
                </Text>
                {isPortfolioTrackerDevice ? (
                    isPortfolioLabelDisplayed && (
                        <Text variant="label" color="textSubdued">
                            <Translation id="deviceManager.status.portfolioTracker" />
                        </Text>
                    )
                ) : (
                    // TODO: when we enable remember mode, grey 'Disconnected' label has to be displayed.
                    <Text variant="label" color="textSecondaryHighlight">
                        <Translation id="deviceManager.status.connected" />
                    </Text>
                )}
            </Box>
        </HStack>
    );
};
