import { BluetoothDeviceManager } from '@suite-native/bluetooth';
import { Screen, ScreenHeader } from '@suite-native/navigation';

export const ConnectBluetoothDeviceScreen = () => (
    <Screen header={<ScreenHeader closeActionType="close" />}>
        <BluetoothDeviceManager />
    </Screen>
);
