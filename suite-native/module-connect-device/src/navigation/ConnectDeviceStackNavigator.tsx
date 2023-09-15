import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ConnectDeviceScreen } from '../screens/ConnectDeviceScreen';

export const ConnectDeviceStack = createNativeStackNavigator<ConnectDeviceStackParamList>();

export const ConnectDeviceStackNavigator = () => (
    <ConnectDeviceStack.Navigator screenOptions={stackNavigationOptionsConfig}>
        <ConnectDeviceStack.Screen
            name={ConnectDeviceStackRoutes.ConnectDeviceCrossroads}
            component={ConnectDeviceScreen}
        />
    </ConnectDeviceStack.Navigator>
);
