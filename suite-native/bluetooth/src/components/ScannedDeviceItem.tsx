import { useEffect, useState } from 'react';
import { BleError, State as AdapterState } from 'react-native-ble-plx';
import { Alert } from 'react-native';

import { AlertBox, Box, Button, HStack, Loader, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { BLEScannedDevice, nativeBleManager } from '@trezor/transport-native-ble';
import { Icon, IconName } from '@suite-common/icons';
import { useActiveColorScheme } from '@suite-native/theme';

import {
    BluetoothPermissionErrors,
    useBluetoothPermissions,
} from '../hooks/useBluetoothPermissions';
import { BluetoothPermissionError } from './BluetoothPermissionError';
import { useBluetoothAdapterState } from '../hooks/useBluetoothAdapterState';
import { BluetoothAdapterStateManager } from './BluetoothAdapterStateManager';

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

    const connectDevice = async () => {
        setIsConnecting(true);
        try {
            await nativeBleManager.connectDevice({
                deviceOrId: bleDevice,
            });
        } catch (error) {
            alert('Error connecting to device');
            Alert.alert('Error connecting to device', error?.message, [{ text: 'OK' }]);
        }
        setIsConnecting(false);
    };

    const lastSeenInSec = Math.floor((Date.now() - device.lastSeenTimestamp) / 1000);
    const seenQuiteLongAgo = lastSeenInSec > 10;

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
