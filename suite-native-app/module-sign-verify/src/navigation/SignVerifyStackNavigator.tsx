import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceConnectionGuardScreen,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
import {
    type SignVerifyStackParamList,
    SignVerifyStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';

const SignVerifyStack = createNativeStackNavigator<SignVerifyStackParamList>();

export const SignVerifyStackNavigator = () => {
    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();

    return (
        <SignVerifyStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {isDeviceConnectionGuardVisible && (
                <SignVerifyStack.Screen
                    name={SignVerifyStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreen}
                />
            )}
            <SignVerifyStack.Screen
                name={SignVerifyStackRoutes.ContinueOnTrezor}
                component={ContinueOnTrezorScreen}
            />
        </SignVerifyStack.Navigator>
    );
};
