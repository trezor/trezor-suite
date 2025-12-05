import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectIsDeviceConnected } from '@suite-common/wallet-core';
import {
    FirmwareLanguageStackParamList,
    FirmwareLanguageStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';
import { DeviceConnectionGuardScreen } from '../screens/DeviceConnectionGuardScreen';

const FirmwareLanguageStack = createNativeStackNavigator<FirmwareLanguageStackParamList>();

const DeviceConnectionGuardScreenWithCancel = () => (
    <DeviceConnectionGuardScreen onCancel={TrezorConnect.cancel} />
);

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
