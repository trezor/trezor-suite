import React, { useEffect, useState } from 'react';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { Linking, SafeAreaView } from 'react-native';

import { BarcodeFormat, useScanBarcodes } from 'vision-camera-code-scanner';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, IconButton, Text } from '@suite-native/atoms';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    StackProps,
} from '@suite-native/navigation';

const cameraWrapperStyle = prepareNativeStyle(_ => ({
    position: 'relative',
    overflow: 'hidden',
    flex: 1,
}));

const cameraStyle = prepareNativeStyle(_ => ({
    flex: 1,
    height: '100%',
}));

const modalHeaderStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    width: '100%',
    padding: utils.spacings.medium,
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 1,
    top: 20,
}));

export const ScanQRCodeModalScreen = ({
    navigation,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.XpubScanModal>) => {
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const { applyStyle } = useNativeStyles();
    const devices = useCameraDevices();
    const device = devices.back;

    useEffect(() => {
        const requestCamera = async () => {
            let cameraPermission = await Camera.getCameraPermissionStatus();
            if (cameraPermission !== 'authorized') {
                setHasCameraPermission(false);
                cameraPermission = await Camera.requestCameraPermission();
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

            navigation.navigate(AccountsImportStackRoutes.XpubScan, {
                qrCode: barcode.displayValue,
            });
        }
    }, [barcodes, navigation]);

    const isCameraAllowed = hasCameraPermission && !!device;

    if (!isCameraAllowed) return <Text>Camera is not allowed.</Text>;

    return (
        <SafeAreaView style={applyStyle(cameraWrapperStyle)}>
            <Box
                style={applyStyle(modalHeaderStyle)}
                justifyContent="space-between"
                alignItems="center"
            >
                {/* Width of close icon button */}
                <Box style={{ width: 48 }} />
                <Text color="gray0">Scan QR</Text>
                {/* TODO first click is not working */}
                <IconButton
                    iconName="close"
                    colorScheme="gray"
                    size="large"
                    isRounded
                    style={{ zIndex: 100 }}
                    onPress={navigation.goBack}
                />
            </Box>
            <Camera
                style={applyStyle(cameraStyle)}
                device={device}
                frameProcessor={frameProcessor}
                frameProcessorFps={5}
                isActive
            />
        </SafeAreaView>
    );
};
