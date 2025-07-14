import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ConfirmFirmwareUpdateScreen } from '../screens/ConfirmFirmwareUpdateScreen';
import { FirmwareInstallationScreen } from '../screens/FirmwareInstallationScreen';

const FirmwareUpdateStack = createNativeStackNavigator<FirmwareUpdateStackParamList>();

export const FirmwareUpdateStackNavigator = () => (
    <FirmwareUpdateStack.Navigator
        initialRouteName={FirmwareUpdateStackRoutes.ConfirmFirmwareUpdate}
        screenOptions={{ ...stackNavigationOptionsConfig }}
    >
        <FirmwareUpdateStack.Screen
            name={FirmwareUpdateStackRoutes.ConfirmFirmwareUpdate}
            component={ConfirmFirmwareUpdateScreen}
        />
        <FirmwareUpdateStack.Screen
            name={FirmwareUpdateStackRoutes.FirmwareInstallation}
            component={FirmwareInstallationScreen}
        />
    </FirmwareUpdateStack.Navigator>
);
