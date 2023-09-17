import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ConnectDeviceCrossroadsScreen } from '../screens/ConnectDeviceCrossroadsScreen';
import { ConnectAndUnlockDeviceScreen } from '../screens/ConnectAndUnlockDeviceScreen';
import { PinMatrixScreen } from '../screens/PinMatrixScreen';

export const ConnectDeviceStack = createNativeStackNavigator<ConnectDeviceStackParamList>();

export const ConnectDeviceStackNavigator = () => (
    <ConnectDeviceStack.Navigator
        screenOptions={stackNavigationOptionsConfig}
        initialRouteName={ConnectDeviceStackRoutes.PinMatrix}
    >
        <ConnectDeviceStack.Screen
            name={ConnectDeviceStackRoutes.ConnectDeviceCrossroads}
            component={ConnectDeviceCrossroadsScreen}
        />
        <ConnectDeviceStack.Screen
            name={ConnectDeviceStackRoutes.ConnectAndUnlockDevice}
            component={ConnectAndUnlockDeviceScreen}
        />
        <ConnectDeviceStack.Screen
            name={ConnectDeviceStackRoutes.PinMatrix}
            component={PinMatrixScreen}
        />
    </ConnectDeviceStack.Navigator>
);
