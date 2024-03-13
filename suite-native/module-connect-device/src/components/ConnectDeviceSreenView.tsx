import { ReactNode, useState } from 'react';
import { Device, BleError } from 'react-native-ble-plx';

import { Box } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles, NativeStyleObject } from '@trezor/styles';
import { nativeBleManager } from '@trezor/transport-native';

import { ConnectDeviceScreenHeader } from './ConnectDeviceScreenHeader';

type ConnectDeviceSreenViewProps = {
    children: ReactNode;
    style?: NativeStyleObject;
};

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

export const ConnectDeviceSreenView = ({ children, style }: ConnectDeviceSreenViewProps) => {
    const { applyStyle } = useNativeStyles();
    const [devices, setDevices] = useState<Device[]>([]);
    const [scanError, setScanError] = useState<BleError | null>();
    const [isScanRunning, setIsScanRunning] = useState<boolean>(false);

    const scanDevices = async () => {
        setScanError(null);
        setIsScanRunning(true);
        setDevices([]);

        nativeBle;

        console.log('Starting device scan');
        const bleManager = bleManagerInstance();
        bleManager.startDeviceScan(devicesUUIDs, scanOptions, (error, scannedDevice) => {
            if (error) {
                console.log('Scan error');
                console.error(error);
                setScanError(error);
                // TODO: is scan stopped automatically if error occurs?
                setIsScanRunning(false);

                return;
            }
            if (scannedDevice) {
                console.log('Scanned device: ', scannedDevice.id, scannedDevice.localName);

                setDevices(devices => {
                    if (devices.find(d => d.id === scannedDevice.id)) {
                        return devices;
                    }

                    return [...devices, scannedDevice];
                });
            }
        });
    };

    return (
        <Screen
            screenHeader={<ConnectDeviceScreenHeader shouldDisplayCancelButton={false} />}
            customHorizontalPadding={0}
            customVerticalPadding={0}
        >
            <Box style={[applyStyle(contentStyle), style]}>{children}</Box>
        </Screen>
    );
};
