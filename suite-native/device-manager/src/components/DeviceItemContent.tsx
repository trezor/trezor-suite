import React from 'react';
import { useSelector } from 'react-redux';

import { Icon, IconName } from '@suite-common/icons';
import { HStack, Box, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    selectDeviceNameById,
    DeviceRootState,
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectDeviceLabelById,
} from '@suite-common/wallet-core';
import { TrezorDevice } from '@suite-common/suite-types';
import { TypographyStyle } from '@trezor/theme';
import { useActiveColorScheme } from '@suite-native/theme';

type DeviceItemContentProps = {
    deviceId?: TrezorDevice['id'];
    isPortfolioLabelDisplayed?: boolean;
    headerTextVariant?: TypographyStyle;
};

type DeviceItemIconProps = Pick<DeviceItemContentProps, 'deviceId'>;

const DeviceItemIcon = ({ deviceId }: DeviceItemIconProps) => {
    const activeColorScheme = useActiveColorScheme();

    // TODO: when we enable remember mode, icon representing disconnected device have to be handled.
    const connectedDeviceIcon: IconName =
        activeColorScheme === 'standard' ? 'trezorConnectedLight' : 'trezorConnectedDark';

    switch (deviceId) {
        case undefined:
            return <Icon name="trezor" color="iconDefault" />;
        case PORTFOLIO_TRACKER_DEVICE_ID:
            return <Icon name="database" color="iconDefault" />;
        default:
            return <Icon name={connectedDeviceIcon} color="svgSource" />;
    }
};

export const DeviceItemContent = ({
    deviceId,
    isPortfolioLabelDisplayed = true,
    headerTextVariant = 'body',
}: DeviceItemContentProps) => {
    const { translate } = useTranslate();
    const deviceName = useSelector((state: DeviceRootState) =>
        selectDeviceNameById(state, deviceId),
    );
    const deviceLabel = useSelector((state: DeviceRootState) =>
        selectDeviceLabelById(state, deviceId),
    );

    const isPortfolioTrackerDevice = deviceId === PORTFOLIO_TRACKER_DEVICE_ID;

    const deviceHeader =
        (isPortfolioTrackerDevice ? deviceName : deviceLabel) ??
        translate('deviceManager.defaultHeader');

    return (
        <HStack alignItems="center" spacing="medium">
            <DeviceItemIcon deviceId={deviceId} />
            <Box>
                <Text variant={headerTextVariant}>{deviceHeader}</Text>
                {deviceId && (
                    <Box>
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
                )}
            </Box>
        </HStack>
    );
};
