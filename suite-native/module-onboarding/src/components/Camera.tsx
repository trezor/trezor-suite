import React, { forwardRef, useEffect, useState } from 'react';
import { Camera as RNCamera, useCameraDevices } from 'react-native-vision-camera';
import { Dimensions, Pressable } from 'react-native';

import { BarcodeFormat, useScanBarcodes } from 'vision-camera-code-scanner';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Text } from '@suite-native/atoms';

export interface CameraProps {
    onResult: (value?: string) => void;
}

const cameraWrapperStyles = prepareNativeStyle<{ isCameraAllowed: boolean }>(
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
                    backgroundColor: utils.colors.gray600,
                },
            },
        ],
    }),
);

const cameraStyles = prepareNativeStyle(_ => ({
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
}));

export const Camera = forwardRef<RNCamera, CameraProps>(({ onResult }, ref) => {
    const [cameraRequested, setCameraRequested] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const { applyStyle } = useNativeStyles();
    const devices = useCameraDevices();
    const device = devices.back;

    const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
        checkInverted: true,
    });

    useEffect(() => {
        (async () => {
            const cameraPermission = await RNCamera.getCameraPermissionStatus();
            console.log('CAMERA PERMISSIONS: ', cameraPermission);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            console.log('CAMERA REQUESTED: ', cameraRequested);
            if (cameraRequested) {
                const status = await RNCamera.requestCameraPermission();
                console.log('CAMERA STATUS: ', status);
                setHasCameraPermission(status === 'authorized');
            }
        })();
    }, [cameraRequested]);

    useEffect(() => {
        if (barcodes && barcodes.length) {
            const [barcode] = barcodes;
            onResult(barcode.displayValue);
        }
    }, [barcodes, onResult]);

    const handleRequestCamera = () => {
        setCameraRequested(true);
    };

    const isCameraAllowed = hasCameraPermission && device;

    return (
        <Pressable
            onPress={handleRequestCamera}
            style={applyStyle(cameraWrapperStyles, { isCameraAllowed: !!isCameraAllowed })}
        >
            {isCameraAllowed ? (
                <RNCamera
                    ref={ref}
                    style={applyStyle(cameraStyles)}
                    device={device}
                    frameProcessor={frameProcessor}
                    frameProcessorFps={5}
                    isActive={!!isCameraAllowed}
                />
            ) : (
                <Text variant="body" color="white">
                    Scan QR
                </Text>
            )}
        </Pressable>
    );
});
