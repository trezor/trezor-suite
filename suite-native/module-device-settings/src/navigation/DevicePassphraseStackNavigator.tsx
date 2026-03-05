import { useCallback, useState } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceConnectionGuardScreenWithCancel,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
import {
    DevicePassphraseStackParamList,
    DevicePassphraseStackRoutes,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { useTogglePassphrase } from '../hooks/useTogglePassphrase';
import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';

const BackupAndPassphraseStack = createNativeStackNavigator<DevicePassphraseStackParamList>();

export const DevicePassphraseStackNavigator = () => {
    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();
    const [isTogglePassphraseStarted, setIsTogglePassphraseStarted] = useState(false);

    const { togglePassphrase } = useTogglePassphrase();

    useFocusEffect(
        useCallback(() => {
            if (!isDeviceConnectionGuardVisible && !isTogglePassphraseStarted) {
                setIsTogglePassphraseStarted(true);
                togglePassphrase();
            }
        }, [isDeviceConnectionGuardVisible, isTogglePassphraseStarted, togglePassphrase]),
    );

    return (
        <BackupAndPassphraseStack.Navigator screenOptions={stackNavigationOptionsConfig}>
            {isDeviceConnectionGuardVisible && (
                <BackupAndPassphraseStack.Screen
                    name={DevicePassphraseStackRoutes.DeviceConnectionGuard}
                    component={DeviceConnectionGuardScreenWithCancel}
                />
            )}
            <BackupAndPassphraseStack.Screen
                name={DevicePassphraseStackRoutes.ContinueOnTrezor}
                component={ContinueOnTrezorScreen}
            />
        </BackupAndPassphraseStack.Navigator>
    );
};
