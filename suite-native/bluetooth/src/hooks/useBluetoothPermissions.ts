import { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import {
    PERMISSIONS,
    RESULTS,
    request,
    requestMultiple,
    check,
    PermissionStatus,
} from 'react-native-permissions';

import Constants from 'expo-constants';

export enum BluetoothPermissionErrors {
    BluetoothAccessBlocked = 'BluetoothAccessBlocked',
    LocationAccessBlocked = 'LocationAccessBlocked',
    NearbyDevicesAccessBlocked = 'NearbyDevicesAccessBlocked',
}

export const useBluetoothPermissions = () => {
    const appState = useRef(AppState.currentState);
    const [hasBluetoothPermissions, setHasBluetoothPermissions] = useState<boolean>(false);
    const [bluetoothPermissionError, setBluetoothPermissionError] =
        useState<BluetoothPermissionErrors>();

    const requestIosPermission = useCallback(
        async ({ checkOnly = false }: { checkOnly?: boolean } = {}) => {
            const permissionFn = checkOnly ? check : request;
            const bluetoothPermissionStatus = await permissionFn(PERMISSIONS.IOS.BLUETOOTH);
            const bluetoothAllowed = bluetoothPermissionStatus === RESULTS.GRANTED;

            if (bluetoothAllowed) {
                setHasBluetoothPermissions(true);
                setBluetoothPermissionError(undefined);
            } else {
                setBluetoothPermissionError(BluetoothPermissionErrors.BluetoothAccessBlocked);
            }
        },
        [],
    );

    const requestAndroidPermission = useCallback(
        async ({ checkOnly = false }: { checkOnly?: boolean } = {}) => {
            let hasError = false;
            const deviceOSVersion = Constants.systemVersion || 0;

            if (deviceOSVersion >= 12) {
                let result: {
                    [PERMISSIONS.ANDROID.BLUETOOTH_CONNECT]: PermissionStatus;
                    [PERMISSIONS.ANDROID.BLUETOOTH_SCAN]: PermissionStatus;
                } = {
                    [PERMISSIONS.ANDROID.BLUETOOTH_CONNECT]: RESULTS.DENIED,
                    [PERMISSIONS.ANDROID.BLUETOOTH_SCAN]: RESULTS.DENIED,
                };
                if (checkOnly) {
                    result[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] = await check(
                        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                    );
                    result[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] = await check(
                        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                    );
                } else {
                    result = await requestMultiple([
                        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
                        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
                    ]);
                }

                if (
                    result[PERMISSIONS.ANDROID.BLUETOOTH_CONNECT] !== RESULTS.GRANTED ||
                    result[PERMISSIONS.ANDROID.BLUETOOTH_SCAN] !== RESULTS.GRANTED
                ) {
                    setBluetoothPermissionError(
                        BluetoothPermissionErrors.NearbyDevicesAccessBlocked,
                    );
                    hasError = true;
                }
            } else {
                const permissionFn = checkOnly ? check : request;
                const bluetoothPermissionStatus = await permissionFn(
                    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
                );

                if (bluetoothPermissionStatus !== RESULTS.GRANTED) {
                    setBluetoothPermissionError(BluetoothPermissionErrors.LocationAccessBlocked);
                    hasError = true;
                }
            }

            if (!hasError) {
                setHasBluetoothPermissions(true);
                setBluetoothPermissionError(undefined);
            }
        },
        [],
    );

    // Checking if app has required permissions every time the app becomes active
    const requestPermissions = useCallback(
        async ({ checkOnly = false }: { checkOnly?: boolean } = {}) => {
            if (Platform.OS === 'ios') {
                await requestIosPermission({ checkOnly });
            }

            if (Platform.OS === 'android') {
                await requestAndroidPermission({ checkOnly });
            }
        },
        [requestIosPermission, requestAndroidPermission],
    );

    // External permission changes must be picked up by the app by tracking the app state
    useLayoutEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                setBluetoothPermissionError(undefined);
                requestPermissions({ checkOnly: true });
            }

            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        requestPermissions({ checkOnly: true });

        return () => {
            subscription.remove();
        };
    }, [requestPermissions]);

    return {
        hasBluetoothPermissions,
        bluetoothPermissionError,
        requestBluetoothPermissions: requestPermissions,
    };
};
