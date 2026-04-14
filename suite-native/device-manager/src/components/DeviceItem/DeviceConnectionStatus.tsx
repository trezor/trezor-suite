import { HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ConnectionDot } from './ConnectionDot';

type DeviceConnectionStatusProps = {
    isConnected: boolean;
    isDeviceInBootloaderMode?: boolean;
};

export const DeviceConnectionStatus = ({
    isConnected,
    isDeviceInBootloaderMode = false,
}: DeviceConnectionStatusProps) => {
    const getDeviceStatus = () => {
        if (isDeviceInBootloaderMode) {
            return 'deviceManager.status.bootloader';
        }

        return isConnected ? 'deviceManager.status.connected' : 'deviceManager.status.disconnected';
    };

    const getTextColor = () => {
        if (isDeviceInBootloaderMode) {
            return 'contentInfo';
        }

        return isConnected ? 'contentBrand' : 'contentSecondary';
    };

    return (
        <HStack alignItems="center" spacing="sp8">
            <ConnectionDot
                isConnected={isConnected}
                isDeviceInBootloaderMode={isDeviceInBootloaderMode}
            />
            <Text
                testID="@device-manager/connection-status"
                variant="body-sm"
                color={getTextColor()}
            >
                <Translation id={getDeviceStatus()} />
            </Text>
        </HStack>
    );
};
