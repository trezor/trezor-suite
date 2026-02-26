import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectDeviceButtonRequestsCodes } from '@suite-common/device';
import {
    DeviceConnectionGuardScreen,
    useDeviceConnectionGuard,
    usePinAction,
} from '@suite-native/device-authorization';
import {
    DevicePinProtectionStackParamList,
    DevicePinProtectionStackRoutes,
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import {
    ConfirmNewPinScreen,
    EnterCurrentPinScreen,
    EnterNewPinScreen,
} from '../screens/EnterPinScreen';

const DevicePinProtectionStack = createNativeStackNavigator<DevicePinProtectionStackParamList>();

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DevicePinProtectionStack
>;

export const DevicePinProtectionStackNavigator = () => {
    const navigation = useNavigation<NavigationProp>();

    const route =
        useRoute<
            RouteProp<
                DeviceSettingsStackParamList,
                DeviceSettingsStackRoutes.DevicePinProtectionStack
            >
        >();

    const { type } = route.params;
    usePinAction({ type, onSuccess: navigation.goBack });

    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();

    const buttonRequestCodes = useSelector(selectDeviceButtonRequestsCodes);
    const lastButtonRequestCode = A.last(buttonRequestCodes);

    const isEnterCurrentPin = lastButtonRequestCode === 'PinMatrixRequestType_Current';
    const isEnterNewPin = lastButtonRequestCode === 'PinMatrixRequestType_NewFirst';
    const isConfirmNewPin = lastButtonRequestCode === 'PinMatrixRequestType_NewSecond';
    const isContinueOnTrezor = !isEnterCurrentPin && !isEnterNewPin && !isConfirmNewPin;

    // To indicate progress to the user we need separate screens for individual steps of the flow.
    // At the same time we need just one available so that navigation.goBack() works as expected.
    return (
        <DevicePinProtectionStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {isDeviceConnectionGuardVisible && (
                <DevicePinProtectionStack.Screen
                    name={DevicePinProtectionStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreen}
                />
            )}
            {isContinueOnTrezor && (
                <DevicePinProtectionStack.Screen
                    name={DevicePinProtectionStackRoutes.ContinueOnTrezor}
                    component={ContinueOnTrezorScreen}
                />
            )}
            {isEnterCurrentPin && (
                <DevicePinProtectionStack.Screen
                    name={DevicePinProtectionStackRoutes.EnterCurrentPin}
                    component={EnterCurrentPinScreen}
                />
            )}
            {isEnterNewPin && (
                <DevicePinProtectionStack.Screen
                    name={DevicePinProtectionStackRoutes.EnterNewPin}
                    component={EnterNewPinScreen}
                />
            )}
            {isConfirmNewPin && (
                <DevicePinProtectionStack.Screen
                    name={DevicePinProtectionStackRoutes.ConfirmNewPin}
                    component={ConfirmNewPinScreen}
                />
            )}
        </DevicePinProtectionStack.Navigator>
    );
};
