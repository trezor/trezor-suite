import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectIsDeviceConnected } from '@suite-common/wallet-core';
import {
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { DeviceConnectionGuardScreen } from '../../../device-authorization/src/screens/DeviceConnectionGuardScreen';
import { ConfirmFirmwareUpdateScreen } from '../screens/ConfirmFirmwareUpdateScreen';
import { FirmwareInstallationScreen } from '../screens/FirmwareInstallationScreen';
import { ThpConfirmationScreen } from '../screens/ThpConfirmationScreen';

const FirmwareUpdateStack = createNativeStackNavigator<FirmwareUpdateStackParamList>();

export const FirmwareUpdateStackNavigator = () => {
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    return (
        <FirmwareUpdateStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {!isDeviceConnected && (
                <FirmwareUpdateStack.Screen
                    name={FirmwareUpdateStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreen}
                />
            )}
            {isDeviceConnected && (
                <FirmwareUpdateStack.Screen
                    name={FirmwareUpdateStackRoutes.ConfirmFirmwareUpdate}
                    component={ConfirmFirmwareUpdateScreen}
                />
            )}
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
