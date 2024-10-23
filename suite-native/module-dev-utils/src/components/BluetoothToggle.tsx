import { Alert } from 'react-native';

import { Button } from '@suite-native/atoms';
import { isBluetoothEnabled, setBluetoothEnabled } from '@suite-native/bluetooth';

export const BluetoothToggle = () => {
    const enableBluetooth = () => {
        Alert.alert('Enable Bluetooth?', 'This will restart the app and enable bluetooth', [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            {
                text: 'Enable',
                onPress: () => setBluetoothEnabled(true),
            },
        ]);
    };

    const disableBluetooth = () => {
        Alert.alert('Disable Bluetooth?', 'This will restart the app and disable bluetooth', [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            {
                text: 'Disable',
                onPress: () => setBluetoothEnabled(false),
            },
        ]);
    };

    if (isBluetoothEnabled) {
        return <Button onPress={disableBluetooth}>🔴 Disable Bluetooth</Button>;
    }

    if (!isBluetoothEnabled) {
        return <Button onPress={enableBluetooth}>🔵 Enable Bluetooth</Button>;
    }
};
