import React from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceState, selectNumberOfDeviceInstances } from '@suite-common/device';
import { HStack, Text } from '@suite-native/atoms';
import { selectShouldFactoryResetBeVisible } from '@suite-native/device';
import { Translation } from '@suite-native/intl';

import { BootloaderModeItemContent } from './BootloaderModeItemContent';
import { DeviceItemContent } from './DeviceItem/DeviceItemContent';
import { DeviceItemIcon } from './DeviceItem/DeviceItemIcon';

export const DeviceSwitchContent = () => {
    const deviceState = useSelector(selectDeviceState);
    const numberOfDevices = useSelector(selectNumberOfDeviceInstances);
    const shouldFactoryResetBeVisible = useSelector(selectShouldFactoryResetBeVisible);

    if (deviceState) {
        return (
            <DeviceItemContent
                deviceState={deviceState ?? undefined}
                headerTextVariant="body-md-strong"
                variant={numberOfDevices > 1 ? 'walletDetail' : 'simple'}
                isSubHeaderForceHidden={true}
            />
        );
    }

    if (shouldFactoryResetBeVisible) {
        return <BootloaderModeItemContent />;
    }

    return (
        <HStack alignItems="center">
            <DeviceItemIcon />
            <Text variant="body-md-strong">
                <Translation id="deviceManager.defaultHeader" />
            </Text>
        </HStack>
    );
};
