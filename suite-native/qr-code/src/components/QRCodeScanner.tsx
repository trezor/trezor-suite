import { useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';

import { BarcodeScanningResult, CameraView, PermissionStatus } from 'expo-camera';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, HStack, Loader, VStack, Text } from '@suite-native/atoms';
import { nativeSpacings } from '@trezor/theme';
import { Icon } from '@suite-common/icons-deprecated';
import { Translation } from '@suite-native/intl';

import { CameraPermissionError } from './CameraPermissionError';
import { useCameraPermission } from '../hooks/useCameraPermission';

type QRCodeScannerProps = {
    onCodeScanned: (data: string) => void;
};

const SCANNER_SIZE = Dimensions.get('screen').width - nativeSpacings.medium * 2;

const cameraContainerStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.medium,
    overflow: 'hidden',
}));

const cameraStyle = prepareNativeStyle(() => ({
    height: SCANNER_SIZE,
    width: SCANNER_SIZE,
}));

export const QRCodeScanner = ({ onCodeScanned }: QRCodeScannerProps) => {
    const { applyStyle } = useNativeStyles();
    const { cameraPermissionStatus } = useCameraPermission();

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

    const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
        setScanned(true);
        onCodeScanned(data);
    };

    if (isCameraLoading) {
        return (
            <Box alignItems="center" justifyContent="center" flex={1}>
                <Loader />
            </Box>
        );
    }

    switch (cameraPermissionStatus) {
        // If the status is "UNDETERMINED" the expo-camera library shows a native permission dialog itself.
        case PermissionStatus.UNDETERMINED:
            return null;

        case PermissionStatus.GRANTED:
            return (
                <VStack spacing="medium" justifyContent="center">
                    <HStack alignItems="center" justifyContent="center">
                        <Icon
                            name="lightbulb"
                            color="backgroundSecondaryDefault"
                            size="mediumLarge"
                        />
                        <Text color="backgroundSecondaryDefault">
                            <Translation id="qrCode.qrCodeHint" />
                        </Text>
                    </HStack>
                    <Box style={applyStyle(cameraContainerStyle)}>
                        <CameraView
                            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                            style={applyStyle(cameraStyle)}
                            barcodeScannerSettings={{
                                barcodeTypes: ['qr'],
                            }}
                            accessibilityLabel="QR code scanner"
                        />
                    </Box>
                </VStack>
            );

        case PermissionStatus.DENIED:
        default:
            return <CameraPermissionError />;
    }
};
