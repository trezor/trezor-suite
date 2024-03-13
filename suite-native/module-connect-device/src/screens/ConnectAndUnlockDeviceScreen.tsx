import { Dimensions } from 'react-native';
import { ReactNode, useEffect, useState } from 'react';
import { Device, BleError } from 'react-native-ble-plx';

import { Box, Button, Loader, Text, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { ConnectDeviceAnimation } from '@suite-native/device';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Screen } from '@suite-native/navigation';
import { nativeBleManager } from '@trezor/transport-native';

import { ConnectDeviceScreenHeader } from '../components/ConnectDeviceScreenHeader';

const ANIMATION_HEIGHT = Dimensions.get('screen').height * 0.6;

const screenContentStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
}));

const animationStyle = prepareNativeStyle(() => ({
    // Both height and width has to be set https://github.com/lottie-react-native/lottie-react-native/blob/master/MIGRATION-5-TO-6.md#updating-the-style-props
    height: ANIMATION_HEIGHT,
    width: '100%',
}));

export const ConnectAndUnlockDeviceScreen = () => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    const [devices, setDevices] = useState<Device[]>([]);
    const [scanError, setScanError] = useState<BleError | null>();
    const [isScanRunning, setIsScanRunning] = useState<boolean>(false);

    const scanDevices = async () => {
        setScanError(null);
        setIsScanRunning(true);
        setDevices([]);

        nativeBleManager.scanDevices(scannedDevices => {
            setDevices(scannedDevices);
        });
    };

    const stopScanning = async () => {
        nativeBleManager.stopDeviceScan();
        setIsScanRunning(false);
    };

    useEffect(() => {
        return () => {
            nativeBleManager.stopDeviceScan();
        };
    }, []);

    return (
        <Screen
            screenHeader={<ConnectDeviceScreenHeader />}
            customHorizontalPadding={0}
            customVerticalPadding={0}
            hasBottomInset={false}
            isScrollable={false}
        >
            <VStack style={applyStyle(screenContentStyle)}>
                <Text variant="titleMedium" textAlign="center">
                    {translate('moduleConnectDevice.connectAndUnlockScreen.title')}
                </Text>
                {!isScanRunning ? (
                    <Button onPress={scanDevices}>Scan devices</Button>
                ) : (
                    <Button onPress={stopScanning}>Stop devices scan</Button>
                )}
                {isScanRunning && (
                    <Box
                        marginTop="large"
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Text>Scanning for devices...</Text>
                        <Loader />
                    </Box>
                )}
                {scanError && (
                    <Box
                        marginTop="large"
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Text>Scan error: {scanError.message}</Text>
                    </Box>
                )}
                <Box>
                    {devices.map(device => (
                        <Box key={device.id}>
                            <Text>{device.name}</Text>
                            <Button
                                onPress={() => nativeBleManager.openDevice({ deviceOrId: device })}
                            >
                                Connect
                            </Button>
                        </Box>
                    ))}
                </Box>
            </VStack>
        </Screen>
    );
};
