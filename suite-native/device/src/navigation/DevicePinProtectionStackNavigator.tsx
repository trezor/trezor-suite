import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DevicePinProtectionStackParamList,
    DevicePinProtectionStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';

export const DevicePinProtection = createNativeStackNavigator<DevicePinProtectionStackParamList>();

export const DevicePinProtectionStackNavigator = () => (
    <DevicePinProtection.Navigator
        initialRouteName={DevicePinProtectionStackRoutes.ContinueOnTrezor}
        screenOptions={stackNavigationOptionsConfig}
    >
        <DevicePinProtection.Screen
            name={DevicePinProtectionStackRoutes.ContinueOnTrezor}
            component={ContinueOnTrezorScreen}
        />
        {/*TODO: To be extended for T1*/}
    </DevicePinProtection.Navigator>
);
