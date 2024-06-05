import { useSelector } from 'react-redux';

import { Box, Card, Divider, HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ConnectionDot } from '@suite-native/device-manager';
import { selectPhysicalDevicesGrouppedById } from '@suite-common/wallet-core';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { DeviceModelIcon } from '@suite-common/icons';

import { About, AboutProps } from './About';
import { WalletRow } from './WalletRow';

const cardStyle = prepareNativeStyle(utils => ({
    padding: 0,
    marginTop: utils.spacings.large,
}));

const deviceStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.medium,
    alignItems: 'center',
    gap: 12,
}));

export const DevicesManagement = ({ onPressAbout }: AboutProps) => {
    const deviceGroups = useSelector(selectPhysicalDevicesGrouppedById);
    const { applyStyle } = useNativeStyles();

    return (
        <>
            <Box paddingHorizontal="large">
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
                                    {firstDevice.label}
                                </Text>
                                <HStack alignItems="center" spacing="small">
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
