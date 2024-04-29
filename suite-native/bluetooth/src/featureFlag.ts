// due to nature of BT, we can't use standart feature flag mechanism
import RNRestart from 'react-native-restart';

import { unecryptedJotaiStorage } from '@suite-native/storage';

export const isBluetoothBuild = process.env.EXPO_PUBLIC_BLUETOOTH_ENABLED === 'true';

export const isBluetoothEnabled =
    isBluetoothBuild && (unecryptedJotaiStorage.getBoolean('bluetoothEnabled') ?? false);

export const setBluetoothEnabled = (value: boolean) => {
    unecryptedJotaiStorage.set('bluetoothEnabled', value);
    RNRestart.restart();
};
