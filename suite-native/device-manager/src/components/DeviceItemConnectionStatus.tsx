import { useSelector } from 'react-redux';
import React from 'react';

import { selectIsDeviceReadyToUseAndAuthorized } from '@suite-native/device';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const DeviceItemConnectionStatus = () => {
    const isDeviceReadyToUseAndAuthorized = useSelector(selectIsDeviceReadyToUseAndAuthorized);

    if (!isDeviceReadyToUseAndAuthorized) return null;

    return (
        <Text variant="label" color="textSecondaryHighlight">
            <Translation id="deviceManager.status.connected" />
        </Text>
    );
};
