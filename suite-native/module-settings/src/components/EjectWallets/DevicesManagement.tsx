import { useSelector } from 'react-redux';

import { selectPhysicalDevicesGrouppedById, shouldDeviceBeRemembered } from '@suite-common/device';
import { Box, Card, Divider, HStack, Text, VStack } from '@suite-native/atoms';
import { ConnectionDot } from '@suite-native/device-manager';
import { DeviceModelIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { AutoEjectSwitch } from './AutoEjectSwitch';
import { WalletRow } from './WalletRow';

export const DevicesManagement = () => {
    const deviceGroups = useSelector(selectPhysicalDevicesGrouppedById);

    return (
        <VStack spacing="sp16">
            <AutoEjectSwitch />
            {deviceGroups.map(devices => {
                const [firstDevice] = devices;
                if (!firstDevice) return null;

                if (!shouldDeviceBeRemembered({ device: firstDevice })) return null;

                const deviceModel = firstDevice.features?.internal_model;

                return (
                    <Card key={firstDevice.id} noPadding>
                        <HStack padding="sp16" alignItems="center" spacing="sp12">
                            {deviceModel && (
                                <DeviceModelIcon deviceModel={deviceModel} size="extraLarge" />
                            )}
                            <Box>
                                <Text variant="body-md-strong" color="textDefault">
                                    {firstDevice.features.label || firstDevice.name}
                                </Text>
                                <HStack alignItems="center" spacing="sp8">
                                    <ConnectionDot isConnected={firstDevice.connected} />
                                    <Text
                                        variant="body-sm"
                                        color={
                                            firstDevice.connected
                                                ? 'textSecondaryHighlight'
                                                : 'textSubdued'
                                        }
                                    >
                                        <Translation
                                            id={
                                                firstDevice.connected
                                                    ? 'moduleSettings.viewOnly.connected'
                                                    : 'moduleSettings.viewOnly.disconnected'
                                            }
                                        />
                                    </Text>
                                </HStack>
                            </Box>
                        </HStack>
                        <Divider />
                        {devices.map(device => (
                            <WalletRow key={`${device.state?.staticSessionId}`} device={device} />
                        ))}
                    </Card>
                );
            })}
        </VStack>
    );
};
