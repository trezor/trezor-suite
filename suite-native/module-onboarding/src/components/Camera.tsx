import React, { useEffect, useState } from 'react';
import { Camera as RNCamera, useCameraDevices } from 'react-native-vision-camera';
import { Linking, View } from 'react-native';

import { BarcodeFormat, useScanBarcodes } from 'vision-camera-code-scanner';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { XpubAddress } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';

export interface CameraProps {
    onResult: (xpubAddress?: XpubAddress) => void;
}

export const CAMERA_HEIGHT = 329;

const cameraWrapperStyle = prepareNativeStyle<{ isCameraAllowed: boolean }>(
    (utils, { isCameraAllowed }) => ({
        height: CAMERA_HEIGHT,
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
    flex: 1,
    height: '100%',
    width: '100%',
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
            {isCameraAllowed ? (
                <RNCamera
                    style={applyStyle(cameraStyle)}
                    device={device}
                    frameProcessor={frameProcessor}
                    frameProcessorFps={5}
                    isActive
                />
            ) : (
                <Text variant="body" color="white">
                    Camera access is denied
                </Text>
            )}
        </View>
    );
};
