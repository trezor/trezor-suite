import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import {
    type BluetoothDevice,
    BluetoothDeviceList,
    type NativeBluetoothRootState,
    selectKnownBluetoothDevices,
    selectNearbyPairableBluetoothDevices,
    useBluetoothDevice,
} from '@suite-native/bluetooth';
import {
    type AuthorizeDeviceStackParamList,
    type AuthorizeDeviceStackRoutes,
    Screen,
    type StackNavigationProps,
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

    // Once a device is connected, it's added to known devices and thus disappears from the list
    // before the transition to the next screen finishes. This ensures it doesn't feel glitchy.
    const [knownBluetoothDevices] = useState(useSelector(selectKnownBluetoothDevices));
    const nearbyPairableBluetoothDevices = useSelector((state: NativeBluetoothRootState) =>
        selectNearbyPairableBluetoothDevices(state, knownBluetoothDevices),
    );

    const handleDeviceButtonPress = useCallback(
        (device: BluetoothDevice) => {
            analytics.report({
                type: events.deviceConnectionDeviceFoundEvent.name,
                payload: {
                    option: 'connect',
                },
            });
            connectBluetoothDevice(device);
        },
        [analytics, connectBluetoothDevice],
    );

    useEffect(() => {
        if (nearbyPairableBluetoothDevices.length === 0) {
            navigation.goBack();
        }
    }, [nearbyPairableBluetoothDevices, navigation]);

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
