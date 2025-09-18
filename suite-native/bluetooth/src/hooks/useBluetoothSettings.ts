import { useCallback } from 'react';
import { Linking, Platform } from 'react-native';

export const useBluetoothSettings = () => {
    const openBluetoothSettings = useCallback(() => {
        if (Platform.OS === 'ios') {
            Linking.openURL('App-Prefs:Bluetooth');
        } else if (Platform.OS === 'android') {
            Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
        }
    }, []);

    const openLocationServicesSettings = useCallback(() => {
        if (Platform.OS === 'android') {
            Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
        }
    }, []);

    return {
        openBluetoothSettings,
        openLocationServicesSettings,
    };
};
