import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { BarCodeEvent, BarCodeScanner, PermissionStatus } from 'expo-barcode-scanner';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Loader } from '@suite-native/atoms';

import { CameraPermissionError } from './CameraPermissionError';
import { useCameraPermission } from '../hooks/useCameraPermission';

type QRCodeScannerProps = {
    onCodeScanned: (data: string) => void;
};

const cameraStyle = prepareNativeStyle(_ => ({
    flex: 1,
    height: '100%',
}));

const barCodeTypes = [BarCodeScanner.Constants.BarCodeType.qr];

export const QRCodeScanner = ({ onCodeScanned }: QRCodeScannerProps) => {
    const { applyStyle } = useNativeStyles();
    const { cameraPermissionStatus, requestCameraPermission } = useCameraPermission();
    const [scanned, setScanned] = useState(false);
    // We don't need wait on iOS, check comment in useEffect lower for more details
    const [isCameraLoading, setIsCameraLoading] = useState(Platform.OS === 'android');

    useEffect(() => {
        // We need to delay mount of BarCodeScanner otherwise it will cause freeze during screen transition
        // maybe this could be removed if we use @react-navigation/native-stack instead of just stack.
        // Also not necessary on iOS because it's fast enough.
        const timeout = setTimeout(() => {
            setIsCameraLoading(false);
        }, 700);

        return () => clearTimeout(timeout);
    }, []);

    const handleBarCodeScanned = ({ data }: BarCodeEvent) => {
        setScanned(true);
        onCodeScanned(data);
    };

    if (isCameraLoading) {
        return (
            <Box alignItems="center" justifyContent="center" flex={1}>
                <Loader title="Loading camera..." />
            </Box>
        );
    }

    switch (cameraPermissionStatus) {
        // If the status is "UNDETERMINED" the expo-barcode-scanner library shows a native permission dialog itself.
        case PermissionStatus.UNDETERMINED:
            return null;

        case PermissionStatus.GRANTED:
            return (
                <BarCodeScanner
                    onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barCodeTypes={barCodeTypes}
                    style={applyStyle(cameraStyle)}
                    type="back"
                    accessibilityLabel="QR code scanner"
                />
            );

        case PermissionStatus.DENIED:
        default:
            return <CameraPermissionError onPermissionRequest={requestCameraPermission} />;
    }
};
