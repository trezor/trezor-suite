import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { selectIsLatestFirmwareInstalled } from '@suite-common/wallet-core';
import { selectIsDeviceFirmwareSupported } from '@suite-native/device';
import {
    ConfirmFirmwareUpdateScreenContent,
    ConfirmFirmwareUpdateScreenFooter,
} from '@suite-native/firmware';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';

import { DeviceOnboardingScreenWithExitButton } from '../components/OnboardingScreenWithExitButton';

type NavigationProp = StackNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate
>;

export const ConfirmFirmwareUpdateScreen = () => {
    const { showToast } = useToast();
    const navigation = useNavigation<NavigationProp>();
    const isDeviceFirmwareSupported = useSelector(selectIsDeviceFirmwareSupported);
    const isLatestFirmwareInstalled = useSelector(selectIsLatestFirmwareInstalled);

    // If user already has the latest firmware installed, skip this screen and navigate to device auth-check directly.
    useFocusEffect(
        useCallback(() => {
            if (isLatestFirmwareInstalled)
                showToast({
                    message: 'latest FW already installed, TODO: skip this screen/step',
                    variant: 'warning',
                });
        }, [isLatestFirmwareInstalled, showToast]),
    );

    const handleUpdateConfirmation = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.FirmwareInstallation);
    };

    const handleSkipUpdate = () => {
        showToast({
            message: 'Skipping firmware update, TODO: navigate to device AC screen',
            variant: 'warning',
        });
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
