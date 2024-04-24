import { State as AdapterState } from 'react-native-ble-plx';

import { AlertBox, Button, Loader, VStack } from '@suite-native/atoms';

import { useBluetoothAdapterState } from '../hooks/useBluetoothAdapterState';
import { BluetoothPermissionErrors } from '../hooks/useBluetoothPermissions';
import { BluetoothPermissionError } from './BluetoothPermissionError';

export const BluetoothAdapterStateManager = () => {
    const { bluetoothState, turnOnBluetooth } = useBluetoothAdapterState();

    if (bluetoothState === AdapterState.PoweredOn) {
        // We are good to go
        return null;
    }

    if (bluetoothState === AdapterState.Unknown || bluetoothState === AdapterState.Resetting) {
        return <Loader title="Loading Bluetooth" />;
    }

    if (bluetoothState === AdapterState.Unsupported) {
        return <AlertBox title={'Bluetooth Unsupported on this device'} variant="error" />;
    }

    if (bluetoothState === AdapterState.Unauthorized) {
        return (
            <BluetoothPermissionError
                error={BluetoothPermissionErrors.BluetoothAccessBlocked}
            ></BluetoothPermissionError>
        );
    }

    if (bluetoothState === AdapterState.PoweredOff) {
        return (
            <VStack spacing="small">
                <AlertBox
                    title={'Bluetooth is turned off. Please turn of Bluetooth to continue.'}
                    variant="error"
                />
                <Button onPress={turnOnBluetooth}>Turn on Bluetooth</Button>
            </VStack>
        );
    }

    // Exhaustive check - this should never happen
    const _exhaustiveCheck: never = bluetoothState;

    return _exhaustiveCheck;
};
