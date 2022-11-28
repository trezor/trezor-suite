import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform } from 'react-native';

import { BarCodeEvent, BarCodeScanner, PermissionStatus } from 'expo-barcode-scanner';

import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    Screen,
    ScreenHeader,
    StackProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';

import { CameraPermissionError } from '../components/CameraPermissionError';
import { useCameraPermission } from '../hooks/useCameraPermission';

const cameraStyle = prepareNativeStyle(_ => ({
    flex: 1,
    height: '100%',
}));

const barCodeTypes = [BarCodeScanner.Constants.BarCodeType.qr];

export const ScanQRCodeModalScreen = ({
    navigation,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.XpubScanModal>) => {
    const { applyStyle } = useNativeStyles();
    const { cameraPermissionStatus, requestCameraPermission } = useCameraPermission();
    const [scanned, setScanned] = useState(false);
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
        navigation.navigate(AccountsImportStackRoutes.XpubScan, {
            qrCode: data,
        });
    };

    return (
        <Screen header={<ScreenHeader title="Scan QR" />}>
            {cameraPermissionStatus === PermissionStatus.GRANTED ? (
                <>
                    {isCameraLoading ? (
                        <Box alignItems="center" justifyContent="center" flex={1}>
                            <ActivityIndicator size="large" />
                            <Text>Loading camera...</Text>
                        </Box>
                    ) : (
                        <BarCodeScanner
                            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                            barCodeTypes={barCodeTypes}
                            style={applyStyle(cameraStyle)}
                            type="back"
                        />
                    )}
                </>
            ) : (
                <CameraPermissionError
                    onPermissionRequest={requestCameraPermission}
                    permissionStatus={cameraPermissionStatus}
                />
            )}
        </Screen>
    );
};
