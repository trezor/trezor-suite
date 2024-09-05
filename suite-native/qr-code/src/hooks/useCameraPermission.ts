import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { Camera, PermissionStatus } from 'expo-camera';

export const useCameraPermission = () => {
    const [cameraPermissionStatus, setCameraPermissionStatus] = useState(
        PermissionStatus.UNDETERMINED,
    );

    useEffect(() => {
        const invokeCameraPermissionDialog = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setCameraPermissionStatus(status);
        };

        invokeCameraPermissionDialog();
    }, []);

    useEffect(() => {
        // When we go back from settings we need to check if the permission was granted.
        const subscription = AppState.addEventListener('change', async nextAppState => {
            if (nextAppState === 'active') {
                // `getCameraPermissionsAsync` has to be called instead of `requestCameraPermissionsAsync`!
                // `requestCameraPermissionsAsync` is triggering system dialog which changes the AppState to background and causes infinite loop of this event listener.
                const { status } = await Camera.getCameraPermissionsAsync();
                setCameraPermissionStatus(status);
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return {
        cameraPermissionStatus,
    };
};
