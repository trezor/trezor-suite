import { useSelector } from 'react-redux';
import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Text } from '@suite-native/atoms';
import { selectDevice } from '@suite-common/wallet-core';
import { ConnectDeviceStackRoutes, RootStackRoutes } from '@suite-native/navigation';

import { ConnectDeviceBackground } from '../components/ConnectDeviceBackground';

export const ConnectingDeviceScreen = () => {
    const device = useSelector(selectDevice);
    const navigation = useNavigation();

    useEffect(() => {
        if (!device?.state) {
            navigation.navigate(RootStackRoutes.ConnectDevice, {
                screen: ConnectDeviceStackRoutes.ConnectDeviceCrossroads,
            });
        }
        console.log(device);
    }, [device, navigation]);

    return (
        <ConnectDeviceBackground>
            <Text>ConnectingDeviceScreen</Text>
        </ConnectDeviceBackground>
    );
};
