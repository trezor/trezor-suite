import React, { useEffect, useState } from 'react';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { TouchableOpacity } from 'react-native';

import { useScanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';

import { Screen } from '@suite-native/navigation';
import { Box, Input, InputWrapper, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const qrScannerStyles = prepareNativeStyle(utils => ({
    height: 329,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: utils.colors.gray600,
    borderRadius: utils.borders.radii.medium,
}));

const qrCameraStyles = prepareNativeStyle(_ => ({
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
}));

export const OnboardingXPub = () => {
    const [cameraRequested, setCameraRequested] = React.useState(false);
    const [hasCameraPermission, setHasCameraPermission] = React.useState(false);
    const [inputText, setInputText] = useState<string>('');
    const { applyStyle } = useNativeStyles();
    const devices = useCameraDevices();

    const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
        checkInverted: true,
    });

    const device = devices.back;

    useEffect(() => {
        (async () => {
            const cameraPermission = await Camera.getCameraPermissionStatus();
            console.log('CAMERA PERMISSIONS: ', cameraPermission);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            console.log('CAMERA REQUESTED: ', cameraRequested);
            if (cameraRequested) {
                const status = await Camera.requestCameraPermission();
                setHasCameraPermission(status === 'authorized');
            }
        })();
    }, [cameraRequested]);

    const handleScanQrCode = () => {
        setCameraRequested(true);
    };

    console.log('DeViCE: ', device);
    console.log('barcodes: ', barcodes);

    return (
        <Screen backgroundColor="black" hasStatusBar={false}>
            <TouchableOpacity onPress={handleScanQrCode} style={applyStyle(qrScannerStyles)}>
                {hasCameraPermission && device ? (
                    <Camera
                        style={applyStyle(qrCameraStyles)}
                        device={device}
                        frameProcessor={frameProcessor}
                        frameProcessorFps={5}
                        isActive
                    />
                ) : (
                    <Text variant="body" color="white">
                        Scan QR
                    </Text>
                )}
            </TouchableOpacity>
            <Box alignItems="center">
                <Text variant="body" color="gray600">
                    or
                </Text>
            </Box>
            <InputWrapper>
                <Input value={inputText} onChange={setInputText} label="Enter x-pub..." />
            </InputWrapper>
        </Screen>
    );
};
