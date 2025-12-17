import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { reportAnalytics } from '@suite-native/analytics';
import {
    BluetoothDevice,
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

    const handleDeviceButtonPress = useCallback(
        (device: BluetoothDevice) => {
            reportAnalytics({
                type: 'device-connection/device-found',
                payload: {
                    option: 'connect',
                },
            });
            connectBluetoothDevice(device);
        },
        [connectBluetoothDevice],
    );

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
                onDeviceButtonPress={handleDeviceButtonPress}
            />
        </Screen>
    );
};
