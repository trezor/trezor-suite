import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useDeviceConnectionGuard } from '@suite-native/device-authorization';
import {
    WipeDeviceStackParamList,
    WipeDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { FactoryResetScreen } from '../screens/FactoryResetScreen';
import { WipeDeviceContinueOnTrezorScreen } from '../screens/WipeDeviceContinueOnTrezorScreen';
import { WipeDeviceLoadingScreen } from '../screens/WipeDeviceLoadingScreen';
import { WipeDeviceScreen } from '../screens/WipeDeviceScreen';

const WipeDeviceStack = createNativeStackNavigator<WipeDeviceStackParamList>();

export const WipeDeviceStackNavigator = () => {
    const { isDeviceConnected } = useDeviceConnectionGuard();

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
            <WipeDeviceStack.Screen
                name={WipeDeviceStackRoutes.FactoryReset}
                component={FactoryResetScreen}
            />
        </WipeDeviceStack.Navigator>
    );
};
