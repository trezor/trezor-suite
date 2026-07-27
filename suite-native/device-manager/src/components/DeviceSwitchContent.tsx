import React from 'react';
import { useSelector } from 'react-redux';

import { selectIsAnyDeviceSelected, selectNumberOfDeviceInstances } from '@suite-common/device';
import { selectHasOnlyEmptyPortfolioTracker } from '@suite-common/wallet-core';
import { HStack, Text } from '@suite-native/atoms';
import { selectShouldFactoryResetBeVisible } from '@suite-native/device';
import { Translation } from '@suite-native/intl';

import { BootloaderModeItemContent } from './BootloaderModeItemContent';
import { DeviceItemContent } from './DeviceItem/DeviceItemContent';
import { DeviceItemIcon } from './DeviceItem/DeviceItemIcon';

export const DeviceSwitchContent = () => {
    const isAnyDeviceSelected = useSelector(selectIsAnyDeviceSelected);
    const hasOnlyEmptyPortfolioTracker = useSelector(selectHasOnlyEmptyPortfolioTracker);
    const shouldFactoryResetBeVisible = useSelector(selectShouldFactoryResetBeVisible);
    const numberOfDeviceInstances = useSelector(selectNumberOfDeviceInstances);

    // Portfolio tracker device is not selected until Connect is initialized.
    if (!isAnyDeviceSelected || hasOnlyEmptyPortfolioTracker) {
        return (
            <HStack alignItems="center">
                <DeviceItemIcon />
                <Text variant="body-md-strong">
                    <Translation id="deviceManager.defaultHeader" />
                </Text>
            </HStack>
        );
    }

    if (shouldFactoryResetBeVisible) {
        return <BootloaderModeItemContent />;
    }

    return (
        <DeviceItemContent
            headerTextVariant="body-md-strong"
            variant={numberOfDeviceInstances > 1 ? 'walletDetail' : 'simple'}
            isSubHeaderForceHidden={true}
        />
    );
};
