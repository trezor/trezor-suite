import { State as AdapterState } from 'react-native-ble-plx';

import { AlertBox, Button, Loader, VStack } from '@suite-native/atoms';

import { useBluetoothAdapterState } from '../hooks/useBluetoothAdapterState';
import { BluetoothPermissionErrors } from '../hooks/useBluetoothPermissions';
import { BluetoothPermissionError } from './BluetoothPermissionError';

export const BluetoothAdapterStateManager = () => {
    const { bluetoothAdapterState, turnOnBluetoothAdapter } = useBluetoothAdapterState();

    if (bluetoothAdapterState === AdapterState.PoweredOn) {
        // We are good to go
        return null;
    }

    if (
        bluetoothAdapterState === AdapterState.Unknown ||
        bluetoothAdapterState === AdapterState.Resetting
    ) {
        return <Loader title="Loading Bluetooth" />;
    }

    if (bluetoothAdapterState === AdapterState.Unsupported) {
        return <AlertBox title={'Bluetooth Unsupported on this device'} variant="error" />;
    }

    if (bluetoothAdapterState === AdapterState.Unauthorized) {
        return (
            <BluetoothPermissionError
                error={BluetoothPermissionErrors.BluetoothAccessBlocked}
            ></BluetoothPermissionError>
        );
    }

    if (bluetoothAdapterState === AdapterState.PoweredOff) {
        return (
            <VStack spacing="small">
                <AlertBox
                    title={'Bluetooth is turned off. Please turn of Bluetooth to continue.'}
                    variant="error"
                />
                <Button onPress={turnOnBluetoothAdapter}>Turn on Bluetooth</Button>
            </VStack>
        );
    }

    // Exhaustive check - this should never happen
    const _exhaustiveCheck: never = bluetoothAdapterState;

    return _exhaustiveCheck;
};
