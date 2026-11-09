import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceConnectionGuardScreen,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
import {
    type FirmwareLanguageStackParamList,
    FirmwareLanguageStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';

const FirmwareLanguageStack = createNativeStackNavigator<FirmwareLanguageStackParamList>();

export const FirmwareLanguageStackNavigator = () => {
    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();

    return (
        <FirmwareLanguageStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {isDeviceConnectionGuardVisible && (
                <FirmwareLanguageStack.Screen
                    name={FirmwareLanguageStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreen}
                />
            )}
            <FirmwareLanguageStack.Screen
                name={FirmwareLanguageStackRoutes.ConfirmLanguageChange}
                component={ContinueOnTrezorScreen}
            />
        </FirmwareLanguageStack.Navigator>
    );
};
