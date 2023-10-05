import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ConnectDeviceCrossroadsScreen } from '../screens/ConnectDeviceCrossroadsScreen';
import { ConnectAndUnlockDeviceScreen } from '../screens/ConnectAndUnlockDeviceScreen';
import { PinMatrixScreen } from '../screens/PinMatrixScreen';
import { ConnectingDeviceScreen } from '../screens/ConnectingDeviceScreen';

export const ConnectDeviceStack = createNativeStackNavigator<ConnectDeviceStackParamList>();

export const ConnectDeviceStackNavigator = () => (
    <ConnectDeviceStack.Navigator screenOptions={stackNavigationOptionsConfig}>
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
        <ConnectDeviceStack.Screen
            name={ConnectDeviceStackRoutes.Connecting}
            component={ConnectingDeviceScreen}
        />
    </ConnectDeviceStack.Navigator>
);
