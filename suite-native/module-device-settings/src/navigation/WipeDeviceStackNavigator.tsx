import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
    useDeviceConnectionGuard();

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
