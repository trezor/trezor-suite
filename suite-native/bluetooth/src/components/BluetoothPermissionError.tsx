import { openSettings } from 'react-native-permissions';

import { AlertBox, Button, VStack } from '@suite-native/atoms';

import { BluetoothPermissionErrors } from '../hooks/useBluetoothPermissions';

type BluetoothPermissionErrorProps = {
    error: BluetoothPermissionErrors;
};

const ERROR_MESSAGES: Record<BluetoothPermissionErrors, string> = {
    [BluetoothPermissionErrors.BluetoothAccessBlocked]:
        'Please enable Bluetooth permission for the app in your phone settings.',
    [BluetoothPermissionErrors.LocationAccessBlocked]: 'Please enable Bluetooth on your phone',
    [BluetoothPermissionErrors.NearbyDevicesAccessBlocked]:
        'Please enable Nearby Devices permission for the app in your phone settings.',
};

export const BluetoothPermissionError = ({ error }: BluetoothPermissionErrorProps) => {
    const handleOpenSettings = async () => {
        await openSettings();
    };

    return (
        <VStack spacing="small">
            <AlertBox
                title={`Bluetooth Permission Error - ${ERROR_MESSAGES[error]}`}
                variant="error"
            ></AlertBox>
            <Button onPress={handleOpenSettings}>Open Settings</Button>
        </VStack>
    );
};
