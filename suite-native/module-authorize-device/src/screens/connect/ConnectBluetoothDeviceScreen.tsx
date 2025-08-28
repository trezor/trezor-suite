import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    BluetoothDeviceList,
    selectNearbyBluetoothDevices,
    selectNearbyPairableBluetoothDevices,
    useBluetoothDevice,
} from '@suite-native/bluetooth';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';

import { BluetoothDeviceScreenHeader } from '../../components/connect/BluetoothDeviceScreenHeader';

type NavigationProps = StackNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.ConnectBluetoothDevice
>;

export const ConnectBluetoothDeviceScreen = () => {
    const { connectBluetoothDevice } = useBluetoothDevice();
    const navigation = useNavigation<NavigationProps>();

    const nearbyBluetoothDevices = useSelector(selectNearbyBluetoothDevices);
    const nearbyPairableBluetoothDevices = useSelector(selectNearbyPairableBluetoothDevices);

    useEffect(() => {
        if (nearbyBluetoothDevices.length === 0) {
            navigation.goBack();
        }
    }, [nearbyBluetoothDevices, navigation]);

    return (
        <Screen header={<BluetoothDeviceScreenHeader />}>
            <BluetoothDeviceList
                variant="connect"
                devices={nearbyPairableBluetoothDevices}
                onDeviceButtonPress={connectBluetoothDevice}
            />
        </Screen>
    );
};
