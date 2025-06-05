import { useSelector } from 'react-redux';

import { selectIsDeviceInBootloader } from '@suite-common/wallet-core';
import { HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ConnectionDot } from './ConnectionDot';

type DeviceConnectionStatusProps = {
    isConnected: boolean;
};

export const DeviceConnectionStatus = ({ isConnected }: DeviceConnectionStatusProps) => {
    const isDeviceInBootloaderMode = useSelector(selectIsDeviceInBootloader);

    const getDeviceStatus = () => {
        if (isDeviceInBootloaderMode) {
            return 'deviceManager.status.bootloader';
        }

        return isConnected ? 'deviceManager.status.connected' : 'deviceManager.status.disconnected';
    };

    const getTextColor = () => {
        if (isDeviceInBootloaderMode) {
            return 'textAlertBlue';
        }

        return isConnected ? 'textSecondaryHighlight' : 'textSubdued';
    };

    return (
        <HStack alignItems="center" spacing="sp8">
            <ConnectionDot isConnected={isConnected} />
            <Text variant="hint" color={getTextColor()}>
                <Translation id={getDeviceStatus()} />
            </Text>
        </HStack>
    );
};
