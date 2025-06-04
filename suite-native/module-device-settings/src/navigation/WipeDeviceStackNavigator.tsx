import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectIsDeviceConnected } from '@suite-common/wallet-core';
import {
    WipeDeviceStackParamList,
    WipeDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { useDeviceConnectionGuard } from '../hooks/useDeviceConnectionGuard';
import { WipeDeviceContinueOnTrezorScreen } from '../screens/WipeDeviceContinueOnTrezorScreen';
import { WipeDeviceLoadingScreen } from '../screens/WipeDeviceLoadingScreen';
import { WipeDeviceScreen } from '../screens/WipeDeviceScreen';

const WipeDeviceStack = createNativeStackNavigator<WipeDeviceStackParamList>();

export const WipeDeviceStackNavigator = () => {
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    useDeviceConnectionGuard();

    if (!isDeviceConnected) return;

    return (
        <WipeDeviceStack.Navigator
            initialRouteName={WipeDeviceStackRoutes.WipeDevice}
            screenOptions={stackNavigationOptionsConfig}
        >
            <WipeDeviceStack.Screen
                name={WipeDeviceStackRoutes.WipeDevice}
                component={WipeDeviceScreen}
            />
            <WipeDeviceStack.Screen
                name={WipeDeviceStackRoutes.ContinueOnTrezor}
                component={WipeDeviceContinueOnTrezorScreen}
            />
            <WipeDeviceStack.Screen
                name={WipeDeviceStackRoutes.WipeDeviceLoadingScreen}
                component={WipeDeviceLoadingScreen}
            />
        </WipeDeviceStack.Navigator>
    );
};
