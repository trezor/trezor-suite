import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { selectIsLatestFirmwareInstalled } from '@suite-common/wallet-core';
import { selectIsDeviceFirmwareSupported } from '@suite-native/device';
import {
    ConfirmFirmwareUpdateScreenContent,
    ConfirmFirmwareUpdateScreenFooter,
} from '@suite-native/firmware';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';

import { DeviceOnboardingScreenWithExitButton } from '../components/OnboardingScreenWithExitButton';

export const ConfirmFirmwareUpdateScreen = ({
    navigation,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate
>) => {
    const isDeviceFirmwareSupported = useSelector(selectIsDeviceFirmwareSupported);
    const isLatestFirmwareInstalled = useSelector(selectIsLatestFirmwareInstalled);

    // If user already has the latest firmware installed, skip this screen and navigate to device auth-check directly.
    useFocusEffect(
        useCallback(() => {
            if (isLatestFirmwareInstalled)
                navigation.navigate(DeviceOnboardingStackRoutes.DeviceTutorial);
        }, [isLatestFirmwareInstalled, navigation]),
    );

    const handleUpdateConfirmation = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.FirmwareInstallation);
    };

    const handleSkipUpdate = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.DeviceTutorial);
    };

    return (
        <DeviceOnboardingScreenWithExitButton
            footer={
                <ConfirmFirmwareUpdateScreenFooter
                    onUpdateConfirmation={handleUpdateConfirmation}
                    // Skip action is disabled for devices with unsupported (outdated) firmware.
                    onSkipUpdate={isDeviceFirmwareSupported ? handleSkipUpdate : undefined}
                />
            }
        >
            <ConfirmFirmwareUpdateScreenContent />
        </DeviceOnboardingScreenWithExitButton>
    );
};
