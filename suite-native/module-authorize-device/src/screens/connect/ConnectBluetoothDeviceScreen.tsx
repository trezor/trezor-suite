import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { EventType } from '@suite-common/analytics-types';
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
import { useAnalytics } from '@suite-native/services';

import { BluetoothDeviceScreenHeader } from '../../components/connect/BluetoothDeviceScreenHeader';

type NavigationProps = StackNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.ConnectBluetoothDevice
>;

export const ConnectBluetoothDeviceScreen = () => {
    const { connectBluetoothDevice } = useBluetoothDevice();
    const navigation = useNavigation<NavigationProps>();
    const analytics = useAnalytics();

    const nearbyBluetoothDevices = useSelector(selectNearbyBluetoothDevices);
    const nearbyPairableBluetoothDevices = useSelector(selectNearbyPairableBluetoothDevices);

    const handleDeviceButtonPress = useCallback(
        (device: BluetoothDevice) => {
            analytics.report({
                type: EventType.DeviceConnectionDeviceFound,
                payload: {
                    option: 'connect',
                },
            });
            connectBluetoothDevice(device);
        },
        [analytics, connectBluetoothDevice],
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
