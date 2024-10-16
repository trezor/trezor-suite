import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DevicePinProtectionStackParamList,
    DevicePinProtectionStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';

export const DevicePinProtectionStack =
    createNativeStackNavigator<DevicePinProtectionStackParamList>();

export const DevicePinProtectionStackNavigator = () => (
    <DevicePinProtectionStack.Navigator
        initialRouteName={DevicePinProtectionStackRoutes.ContinueOnTrezor}
        screenOptions={stackNavigationOptionsConfig}
    >
        <DevicePinProtectionStack.Screen
            name={DevicePinProtectionStackRoutes.ContinueOnTrezor}
            component={ContinueOnTrezorScreen}
        />
        {/*TODO: To be extended for T1*/}
    </DevicePinProtectionStack.Navigator>
);
