import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ConnectAndUnlockDeviceScreen } from '../screens/ConnectAndUnlockDeviceScreen';
import { PinScreen } from '../screens/PinScreen';
import { ConnectingDeviceScreen } from '../screens/ConnectingDeviceScreen';

export const ConnectDeviceStack = createNativeStackNavigator<ConnectDeviceStackParamList>();

export const ConnectDeviceStackNavigator = () => (
    <ConnectDeviceStack.Navigator screenOptions={stackNavigationOptionsConfig}>
        <ConnectDeviceStack.Screen
            name={ConnectDeviceStackRoutes.ConnectAndUnlockDevice}
            component={ConnectAndUnlockDeviceScreen}
        />
        <ConnectDeviceStack.Screen
            name={ConnectDeviceStackRoutes.PinMatrix}
            component={PinScreen}
        />
        <ConnectDeviceStack.Screen
            name={ConnectDeviceStackRoutes.ConnectingDevice}
            component={ConnectingDeviceScreen}
        />
    </ConnectDeviceStack.Navigator>
);
