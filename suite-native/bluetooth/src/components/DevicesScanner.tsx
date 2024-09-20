import { useEffect } from 'react';
import { State as AdapterState } from 'react-native-ble-plx';

import { AlertBox, Box, Button, Loader, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { nativeBleManager } from '@trezor/transport-native-ble';

import { useBluetoothAdapterState } from '../hooks/useBluetoothAdapterState';
import { useBluetoothPermissions } from '../hooks/useBluetoothPermissions';
import { useBluetoothState } from '../hooks/useBluetoothState';
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

    const { hasBluetoothPermissions, requestBluetoothPermissions, bluetoothPermissionError } =
        useBluetoothPermissions();
    const { bluetoothAdapterState } = useBluetoothAdapterState();
    const bluetoothState = useBluetoothState();
    const isScanRunning = bluetoothState.status === 'scanning';
    const scannedDevices = isScanRunning ? bluetoothState.devices : [];
    const scanError = bluetoothState.status === 'scanError' ? bluetoothState.error : null;

    const stopScanning = () => {
        nativeBleManager.stopDeviceScan();
    };

    const scanDevices = () => {
        nativeBleManager.scanDevices(
            _newlyScannedDevices => {},
            _error => {
                stopScanning();
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
        bluetoothState.status === 'idle' &&
        hasBluetoothPermissions &&
        bluetoothAdapterState === AdapterState.PoweredOn;
    const shouldShowBluetoothAdapterManager =
        bluetoothAdapterState !== AdapterState.PoweredOn && hasBluetoothPermissions;
    const shouldShowBluetoothPermissionError = !!bluetoothPermissionError;
    const shouldShowPairingBanner = bluetoothState.status === 'pairing';

    return (
        <VStack style={applyStyle(containerStyle)} spacing="large">
            <Text>
                hasBluetoothPermissions: {hasBluetoothPermissions ? 'true' : 'false'} {'\n'}
                bluetoothPermissionError: {bluetoothPermissionError} {'\n'}
                bluetoothAdapterState: {bluetoothAdapterState} {'\n'}
                bluetoothState: {bluetoothState.status} {'\n'}
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
            {shouldShowPairingBanner && (
                <AlertBox
                    variant="info"
                    title="Pairing with device... Please accept pairing both on mobile and Trezor device."
                />
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
