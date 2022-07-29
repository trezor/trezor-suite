import React, { useEffect, useState } from 'react';
import { Camera as RNCamera, useCameraDevices } from 'react-native-vision-camera';
import { Dimensions, Linking, View } from 'react-native';

import { BarcodeFormat, useScanBarcodes } from 'vision-camera-code-scanner';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export interface CameraProps {
    onResult: (value?: string) => void;
}

const cameraWrapperStyle = prepareNativeStyle<{ isCameraAllowed: boolean }>(
    (utils, { isCameraAllowed }) => ({
        height: 329,
        borderRadius: utils.borders.radii.medium,
        extend: [
            {
                condition: isCameraAllowed,
                style: {
                    overflow: 'hidden',
                },
            },
            {
                condition: !isCameraAllowed,
                style: {
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: utils.colors.gray800,
                },
            },
        ],
    }),
);

const cameraStyle = prepareNativeStyle(_ => ({
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
}));

export const Camera = ({ onResult }: CameraProps) => {
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const { applyStyle } = useNativeStyles();
    const devices = useCameraDevices();
    const device = devices.back;

    useEffect(() => {
        const requestCamera = async () => {
            let cameraPermission = await RNCamera.getCameraPermissionStatus();
            if (cameraPermission !== 'authorized') {
                setHasCameraPermission(false);
                cameraPermission = await RNCamera.requestCameraPermission();
            }
            setHasCameraPermission(cameraPermission === 'authorized');
            if (cameraPermission === 'denied') {
                await Linking.openSettings();
            }
        };

        requestCamera();
    }, []);

    const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
        checkInverted: true,
    });

    useEffect(() => {
        if (barcodes && barcodes.length) {
            const [barcode] = barcodes;
            onResult(barcode.displayValue);
        }
    }, [barcodes, onResult]);

    const isCameraAllowed = hasCameraPermission && !!device;

    return (
        <View style={applyStyle(cameraWrapperStyle, { isCameraAllowed })}>
            {isCameraAllowed && (
                <RNCamera
                    style={applyStyle(cameraStyle)}
                    device={device}
                    frameProcessor={frameProcessor}
                    frameProcessorFps={5}
                    isActive
                />
            )}
        </View>
    );
};
