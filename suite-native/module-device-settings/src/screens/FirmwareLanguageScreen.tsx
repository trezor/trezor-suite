import { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { ContinueOnTrezorScreenContent } from '@suite-native/device';
import { useDeviceConnectionGuard } from '@suite-native/device-authorization';
import { useFirmwareLanguage } from '@suite-native/firmware';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';

import { DeviceInteractionScreenWrapper } from '../components/DeviceInteractionScreenWrapper';

export const FirmwareLanguageScreen = ({
    navigation,
    route,
}: StackProps<DeviceSettingsStackParamList, DeviceSettingsStackRoutes.FirmwareLanguage>) => {
    const { language } = route.params;

    useInterceptNativeNavigation();

    const { isDeviceConnected } = useDeviceConnectionGuard();
    const { changeFirmwareLanguage } = useFirmwareLanguage({ onCompletion: navigation.goBack });

    useFocusEffect(
        useCallback(() => {
            changeFirmwareLanguage(language);
        }, [changeFirmwareLanguage, language]),
    );

    if (!isDeviceConnected) return;

    return (
        <DeviceInteractionScreenWrapper>
            <ContinueOnTrezorScreenContent />
        </DeviceInteractionScreenWrapper>
    );
};
