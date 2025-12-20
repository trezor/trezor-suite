import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectIsDeviceConnected } from '@suite-common/wallet-core';
import { DeviceConnectionGuardScreenWithCancel } from '@suite-native/device-authorization';
import {
    WipeDeviceStackParamList,
    WipeDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { FactoryResetScreen } from '../screens/FactoryResetScreen';
import { WipeDeviceContinueOnTrezorScreen } from '../screens/WipeDeviceContinueOnTrezorScreen';
import { WipeDeviceLoadingScreen } from '../screens/WipeDeviceLoadingScreen';

const WipeDeviceStack = createNativeStackNavigator<WipeDeviceStackParamList>();

export const WipeDeviceStackNavigator = () => {
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    return (
        <WipeDeviceStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {!isDeviceConnected && (
                <WipeDeviceStack.Screen
                    name={WipeDeviceStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreenWithCancel}
                />
            )}
            {isDeviceConnected && (
                <WipeDeviceStack.Screen
                    name={WipeDeviceStackRoutes.ContinueOnTrezor}
                    component={WipeDeviceContinueOnTrezorScreen}
                />
            )}
            <WipeDeviceStack.Screen
                name={WipeDeviceStackRoutes.WipeDeviceLoadingScreen}
                component={WipeDeviceLoadingScreen}
            />
            <WipeDeviceStack.Screen
                name={WipeDeviceStackRoutes.FactoryReset}
                component={FactoryResetScreen}
            />
        </WipeDeviceStack.Navigator>
    );
};
