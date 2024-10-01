import { useSelector } from 'react-redux';

import { Box, Card, Divider, HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ConnectionDot } from '@suite-native/device-manager';
import { selectPhysicalDevicesGrouppedById } from '@suite-common/wallet-core';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { DeviceModelIcon } from '@suite-common/icons-deprecated';

import { About, AboutProps } from './About';
import { WalletRow } from './WalletRow';

const cardStyle = prepareNativeStyle(utils => ({
    padding: 0,
    marginTop: utils.spacings.sp24,
}));

const deviceStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp16,
    alignItems: 'center',
    gap: 12,
}));

export const DevicesManagement = ({ onPressAbout }: AboutProps) => {
    const deviceGroups = useSelector(selectPhysicalDevicesGrouppedById);
    const { applyStyle } = useNativeStyles();

    return (
        <>
            <Box paddingHorizontal="sp24">
                <About onPressAbout={onPressAbout} />
            </Box>
            {deviceGroups.map(devices => {
                const [firstDevice] = devices;
                const deviceModel = firstDevice.features?.internal_model;

                return (
                    <Card key={firstDevice.id} style={applyStyle(cardStyle)}>
                        <HStack style={applyStyle(deviceStyle)}>
                            {deviceModel && (
                                <DeviceModelIcon deviceModel={deviceModel} size="extraLarge" />
                            )}
                            <Box>
                                <Text variant="highlight" color="textDefault">
                                    {firstDevice.features.label || firstDevice.name}
                                </Text>
                                <HStack alignItems="center" spacing="sp8">
                                    <ConnectionDot isConnected={firstDevice.connected} />
                                    <Text
                                        variant="hint"
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
                            <WalletRow key={`${device.state}`} device={device} />
                        ))}
                    </Card>
                );
            })}
        </>
    );
};
