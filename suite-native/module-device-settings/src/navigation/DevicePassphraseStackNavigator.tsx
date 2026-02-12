import { useSelector } from 'react-redux';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { selectIsDeviceConnected } from '@suite-common/device';
import { DeviceConnectionGuardScreenWithCancel } from '@suite-native/device-authorization';
import {
    DevicePassphraseStackParamList,
    DevicePassphraseStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';

const BackupAndPassphraseStack = createNativeStackNavigator<DevicePassphraseStackParamList>();

export const DevicePassphraseStackNavigator = () => {
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    return (
        <BackupAndPassphraseStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {!isDeviceConnected && (
                <BackupAndPassphraseStack.Screen
                    name={DevicePassphraseStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreenWithCancel}
                />
            )}
            {isDeviceConnected && (
                <BackupAndPassphraseStack.Screen
                    name={DevicePassphraseStackRoutes.ContinueOnTrezor}
                    component={ContinueOnTrezorScreen}
                />
            )}
        </BackupAndPassphraseStack.Navigator>
    );
};
