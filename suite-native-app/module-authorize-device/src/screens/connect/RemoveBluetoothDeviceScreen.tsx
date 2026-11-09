import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type BluetoothDevice,
    BluetoothDeviceList,
    selectKnownBluetoothDevices,
    useBluetoothDevice,
} from '@suite-native/bluetooth';
import {
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    Screen,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { BluetoothDeviceScreenHeader } from '../../components/connect/BluetoothDeviceScreenHeader';

type NavigationProps = StackNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.RemoveBluetoothDevice
>;

export const RemoveBluetoothDeviceScreen = () => {
    const { removeBluetoothDevice } = useBluetoothDevice();
    const navigation = useNavigation<NavigationProps>();

    const knownBluetoothDevices = useSelector(selectKnownBluetoothDevices);

    const onDeviceButtonPress = (device: BluetoothDevice) => {
        removeBluetoothDevice(device);
        navigation.replace(AuthorizeDeviceStackRoutes.TurnOnAndUnlockDevice);
    };

    return (
        <Screen header={<BluetoothDeviceScreenHeader />}>
            <BluetoothDeviceList
                variant="remove"
                devices={knownBluetoothDevices}
                onDeviceButtonPress={onDeviceButtonPress}
            />
        </Screen>
    );
};
