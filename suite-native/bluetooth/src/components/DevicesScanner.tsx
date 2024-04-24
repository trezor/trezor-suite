import { useEffect, useState } from 'react';
import { State as AdapterState, BleError } from 'react-native-ble-plx';

import { AlertBox, Box, Button, Loader, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { BLEScannedDevice, nativeBleManager } from '@trezor/transport-native-ble';

import { useBluetoothAdapterState } from '../hooks/useBluetoothAdapterState';
import { useBluetoothPermissions } from '../hooks/useBluetoothPermissions';
import { BluetoothAdapterStateManager } from './BluetoothAdapterStateManager';
import { BluetoothPermissionError } from './BluetoothPermissionError';
import { ScannedDeviceItem } from './ScannedDeviceItem';

const containerStyle = prepareNativeStyle(utils => ({
    flex: 1,
    width: '100%',
    paddingHorizontal: utils.spacings.medium,
}));

export const DevicesScanner = () => {
    const { applyStyle } = useNativeStyles();

    const [scannedDevices, setScannedDevices] = useState<BLEScannedDevice[]>([]);
    const [scanError, setScanError] = useState<BleError | null>();
    const [isScanRunning, setIsScanRunning] = useState<boolean>(false);
    const { hasBluetoothPermissions, requestBluetoothPermissions, bluetoothPermissionError } =
        useBluetoothPermissions();
    const { bluetoothState } = useBluetoothAdapterState();

    const stopScanning = async () => {
        nativeBleManager.stopDeviceScan();
        setIsScanRunning(false);
        setScannedDevices([]);
    };

    const scanDevices = () => {
        setScanError(null);
        setIsScanRunning(true);
        setScannedDevices([]);

        nativeBleManager.scanDevices(
            newlyScannedDevices => {
                setScannedDevices(newlyScannedDevices);
            },
            error => {
                setScanError(error);
                stopScanning();
                setScannedDevices([]);
            },
        );
    };

    const requestPermissions = () => {
        return requestBluetoothPermissions();
    };

    useEffect(() => {
        return () => {
            stopScanning();
        };
    }, []);

    const shouldShowRequestPermission = !hasBluetoothPermissions;
    const shouldShowScanDevicesButton =
        !isScanRunning && hasBluetoothPermissions && bluetoothState === AdapterState.PoweredOn;
    const shouldShowBluetoothAdapterManager =
        bluetoothState !== AdapterState.PoweredOn && !isScanRunning && hasBluetoothPermissions;
    const shouldShowBluetoothPermissionError = !!bluetoothPermissionError;

    return (
        <VStack style={applyStyle(containerStyle)} spacing="large">
            <Text>
                hasBluetoothPermissions: {hasBluetoothPermissions ? 'true' : 'false'} {'\n'}
                bluetoothPermissionError: {bluetoothPermissionError} {'\n'}
                bluetoothState: {bluetoothState} {'\n'}
                isScanRunning: {isScanRunning ? 'true' : 'false'} {'\n'}
                shouldShowRequestPermission: {shouldShowRequestPermission ? 'true' : 'false'} {'\n'}
            </Text>
            {shouldShowRequestPermission && (
                <VStack>
                    <AlertBox
                        variant="warning"
                        title="We need Bluetooth permissions to scan for devices."
                    />
                    <Button onPress={requestPermissions}>Request permissions</Button>
                </VStack>
            )}
            {shouldShowBluetoothAdapterManager && <BluetoothAdapterStateManager />}

            {shouldShowBluetoothPermissionError && (
                <BluetoothPermissionError error={bluetoothPermissionError} />
            )}
            {shouldShowScanDevicesButton && <Button onPress={scanDevices}>Scan devices</Button>}
            {isScanRunning && (
                <VStack>
                    <Box
                        marginTop="large"
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Text>Scanning for devices...</Text>
                        <Loader />
                    </Box>
                    <Button onPress={stopScanning}>Stop scanning</Button>
                </VStack>
            )}
            {scanError && (
                <AlertBox
                    variant="error"
                    title={`Error while scanning for devices: ${scanError}`}
                />
            )}
            {isScanRunning && (
                <VStack>
                    {scannedDevices.map(scannedDevice => (
                        <ScannedDeviceItem
                            key={scannedDevice.bleDevice.id}
                            device={scannedDevice}
                        />
                    ))}
                </VStack>
            )}
        </VStack>
    );
};
