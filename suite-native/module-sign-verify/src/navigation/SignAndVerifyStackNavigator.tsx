import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceConnectionGuardScreen,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
import {
    type SignAndVerifyStackParamList,
    SignAndVerifyStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';

const SignAndVerifyStack = createNativeStackNavigator<SignAndVerifyStackParamList>();

export const SignAndVerifyStackNavigator = () => {
    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();

    return (
        <SignAndVerifyStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {isDeviceConnectionGuardVisible && (
                <SignAndVerifyStack.Screen
                    name={SignAndVerifyStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreen}
                />
            )}
            <SignAndVerifyStack.Screen
                name={SignAndVerifyStackRoutes.ContinueOnTrezor}
                component={ContinueOnTrezorScreen}
            />
        </SignAndVerifyStack.Navigator>
    );
};
