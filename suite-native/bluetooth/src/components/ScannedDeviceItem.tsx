import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { Icon, IconName } from '@suite-common/icons-deprecated';
import { Box, Button, HStack, Loader, Text } from '@suite-native/atoms';
import { useActiveColorScheme } from '@suite-native/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { BLEScannedDevice, nativeBleManager } from '@trezor/transport-native-ble';

type ContainerStylePayload = {
    seenQuiteLongAgo: boolean;
};
const containerStyle = prepareNativeStyle<ContainerStylePayload>((_, { seenQuiteLongAgo }) => ({
    flexDirection: 'row',
    borderWidth: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    extend: {
        condition: seenQuiteLongAgo,
        style: {
            opacity: 0.5,
        },
    },
}));

const deviceItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    padding: utils.spacings.extraSmall,
    backgroundColor: utils.colors.backgroundSurfaceElevation2,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
}));

const DeviceIcon = () => {
    const activeColorScheme = useActiveColorScheme();
    const { applyStyle } = useNativeStyles();

    const connectedDeviceIcon: IconName =
        activeColorScheme === 'standard' ? 'trezorConnectedLight' : 'trezorConnectedDark';

    return (
        <Box style={applyStyle(deviceItemStyle)}>
            <Icon name={connectedDeviceIcon} color="svgSource" />
        </Box>
    );
};

export const ScannedDeviceItem = ({ device }: { device: BLEScannedDevice }) => {
    const { bleDevice } = device;
    const { applyStyle } = useNativeStyles();
    const [isConnecting, setIsConnecting] = useState(false);
    const [_rerender, setRerender] = useState(0);

    // Rerender every second to update the "Last seen" text
    useEffect(() => {
        const interval = setInterval(() => {
            setRerender(prev => prev + 1);
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const connectDevice = async () => {
        setIsConnecting(true);
        try {
            await nativeBleManager.connectDeviceWithRetry({
                deviceOrId: bleDevice,
                maxRetries: 2,
            });
        } catch (error) {
            alert('Error connecting to device');
            Alert.alert('Error connecting to device', error?.message, [{ text: 'OK' }]);
        }
        setIsConnecting(false);
    };

    const lastSeenInSec = Math.floor((Date.now() - device.lastSeenTimestamp) / 1000);
    const seenQuiteLongAgo = lastSeenInSec > 5;

    if (lastSeenInSec > 30) {
        // This device is probably not in range anymore or it's not advertising anymore
        return null;
    }

    return (
        <Box style={applyStyle(containerStyle, { seenQuiteLongAgo })}>
            <HStack alignItems="center">
                <DeviceIcon />
                <Box>
                    <Text variant="highlight">{bleDevice.name}</Text>
                    <Text variant="hint">{bleDevice.id}</Text>
                    {seenQuiteLongAgo && (
                        <Text variant="label">Last seen: {lastSeenInSec}s ago</Text>
                    )}
                </Box>
            </HStack>
            {isConnecting ? (
                <Box paddingRight="extraLarge">
                    <Loader size="small" />
                </Box>
            ) : (
                <Button onPress={connectDevice} isDisabled={isConnecting}>
                    Connect
                </Button>
            )}
        </Box>
    );
};
