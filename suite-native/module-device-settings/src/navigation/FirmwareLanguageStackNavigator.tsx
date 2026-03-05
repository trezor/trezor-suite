import { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
    DeviceConnectionGuardScreen,
    useDeviceConnectionGuard,
} from '@suite-native/device-authorization';
import { useFirmwareLanguage } from '@suite-native/firmware';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    FirmwareLanguageStackParamList,
    FirmwareLanguageStackRoutes,
    StackProps,
    stackNavigationOptionsConfig,
} from '@suite-native/navigation';

import { ContinueOnTrezorScreen } from '../screens/ContinueOnTrezorScreen';

const FirmwareLanguageStack = createNativeStackNavigator<FirmwareLanguageStackParamList>();

export const FirmwareLanguageStackNavigator = ({
    route,
}: StackProps<DeviceSettingsStackParamList, DeviceSettingsStackRoutes.FirmwareLanguageStack>) => {
    const { language } = route.params;

    const { isDeviceConnectionGuardVisible } = useDeviceConnectionGuard();
    const { changeFirmwareLanguage } = useFirmwareLanguage();

    useFocusEffect(
        useCallback(() => {
            if (!isDeviceConnectionGuardVisible) {
                changeFirmwareLanguage(language);
            }
        }, [isDeviceConnectionGuardVisible, changeFirmwareLanguage, language]),
    );

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
