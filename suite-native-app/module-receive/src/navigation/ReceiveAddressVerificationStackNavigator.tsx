import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceConnectionGuardScreen,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
import {
    type ReceiveAddressVerificationStackParamList,
    ReceiveAddressVerificationStackRoutes,
    type ReceiveStackParamList,
    type ReceiveStackRoutes,
    type StackProps,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ReceiveAddressVerificationScreen } from '../screens/ReceiveAddressVerificationScreen';

const ReceiveAddressVerificationStack =
    createNativeStackNavigator<ReceiveAddressVerificationStackParamList>();

export const ReceiveAddressVerificationStackNavigator = ({
    route: {
        params: { accountKey, addressPath, source },
    },
}: StackProps<ReceiveStackParamList, ReceiveStackRoutes.ReceiveAddressVerification>) => {
    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();

    if (isDeviceConnectionGuardVisible) {
        return (
            <ReceiveAddressVerificationStack.Navigator screenOptions={stackNavigationOptionsConfig}>
                <ReceiveAddressVerificationStack.Screen
                    name={ReceiveAddressVerificationStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreen}
                />
            </ReceiveAddressVerificationStack.Navigator>
        );
    }

    return (
        <ReceiveAddressVerificationStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            <ReceiveAddressVerificationStack.Screen
                name={ReceiveAddressVerificationStackRoutes.ContinueOnTrezor}
                component={ReceiveAddressVerificationScreen}
                initialParams={{ accountKey, addressPath, source }}
            />
        </ReceiveAddressVerificationStack.Navigator>
    );
};
