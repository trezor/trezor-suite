import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { useFocusEffect } from '@react-navigation/core';
import { BarCodeScanner, PermissionStatus } from 'expo-barcode-scanner';

export const useCameraPermission = () => {
    const [cameraPermissionStatus, setCameraPermissionStatus] = useState<PermissionStatus>(
        PermissionStatus.UNDETERMINED,
    );

    const checkCameraPermissionStatus = useCallback(async () => {
        const { status } = await BarCodeScanner.getPermissionsAsync();
        setCameraPermissionStatus(status);

        return status;
    }, []);

    useEffect(() => {
        // When we go back from settings we need to check if the permission was granted.
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                checkCameraPermissionStatus();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [checkCameraPermissionStatus]);

    useFocusEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await BarCodeScanner.getPermissionsAsync();

            setCameraPermissionStatus(status);

            if (status === PermissionStatus.UNDETERMINED) {
                await BarCodeScanner.requestPermissionsAsync();
                checkCameraPermissionStatus();
            }
        };

        getBarCodeScannerPermissions();
    });

    const requestCameraPermission = useCallback(async () => {
        const status = await checkCameraPermissionStatus();
        if (status === PermissionStatus.UNDETERMINED) {
            await BarCodeScanner.requestPermissionsAsync();
        } else if (status === PermissionStatus.DENIED) {
            await Linking.openSettings();
        }
        checkCameraPermissionStatus();
    }, [checkCameraPermissionStatus]);

    return {
        cameraPermissionStatus,
        requestCameraPermission,
    };
};
