import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectIsDeviceConnected } from '@suite-common/wallet-core';
import { DeviceConnectionGuardScreenWithCancel } from '@suite-native/device-authorization';
import {
    FirmwareLanguageStackParamList,
    FirmwareLanguageStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';

const FirmwareLanguageStack = createNativeStackNavigator<FirmwareLanguageStackParamList>();

export const FirmwareLanguageStackNavigator = () => {
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    return (
        <FirmwareLanguageStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {!isDeviceConnected && (
                <FirmwareLanguageStack.Screen
                    name={FirmwareLanguageStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreenWithCancel}
                />
            )}
            {isDeviceConnected && (
                <FirmwareLanguageStack.Screen
                    name={FirmwareLanguageStackRoutes.ConfirmLanguageChange}
                    component={ContinueOnTrezorScreen}
                />
            )}
        </FirmwareLanguageStack.Navigator>
    );
};
