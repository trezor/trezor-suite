import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceConnectionGuardScreen,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
import {
    type FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ConfirmFirmwareUpdateScreen } from '../screens/ConfirmFirmwareUpdateScreen';
import { FirmwareInstallationScreen } from '../screens/FirmwareInstallationScreen';
import { ThpConfirmationScreen } from '../screens/ThpConfirmationScreen';

const FirmwareUpdateStack = createNativeStackNavigator<FirmwareUpdateStackParamList>();

export const FirmwareUpdateStackNavigator = () => {
    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();

    return (
        <FirmwareUpdateStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {isDeviceConnectionGuardVisible && (
                <FirmwareUpdateStack.Screen
                    name={FirmwareUpdateStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreen}
                />
            )}
            <FirmwareUpdateStack.Screen
                name={FirmwareUpdateStackRoutes.ConfirmFirmwareUpdate}
                component={ConfirmFirmwareUpdateScreen}
            />
            <FirmwareUpdateStack.Screen
                name={FirmwareUpdateStackRoutes.FirmwareInstallation}
                component={FirmwareInstallationScreen}
            />
            <FirmwareUpdateStack.Screen
                name={FirmwareUpdateStackRoutes.ThpConfirmation}
                component={ThpConfirmationScreen}
            />
        </FirmwareUpdateStack.Navigator>
    );
};
