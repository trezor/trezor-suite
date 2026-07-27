import React from 'react';
import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import { selectIsDeviceFirmwareSupported } from '@suite-native/device';
import { ConfirmFirmwareUpdateScreenFooter, FirmwareVersionCard } from '@suite-native/firmware';
import { Translation } from '@suite-native/intl';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type StackProps,
} from '@suite-native/navigation';

import { updateOnboardingAnalyticsAtom } from '../../atoms';
import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

export const ConfirmFirmwareUpdateScreen = ({
    navigation,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate
>) => {
    const isDeviceFirmwareSupported = useSelector(selectIsDeviceFirmwareSupported);

    const updateOnboardingAnalytics = useSetAtom(updateOnboardingAnalyticsAtom);

    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();

    const handleUpdateConfirmation = () => {
        navigation.replace(DeviceOnboardingStackRoutes.FirmwareInfo);
    };

    const handleSkipUpdate = () => {
        updateOnboardingAnalytics({
            firmware: 'skip',
        });
        navigateToNextScreenAfterFirmwareInstallation();
    };

    return (
        <DeviceOnboardingScreenWithExitButton
            screenHeaderTitle={<Translation id="firmware.firmwareUpdateScreen.title" />}
            screenHeaderSubtitle={<Translation id="firmware.firmwareUpdateScreen.subtitle" />}
            footer={
                <ConfirmFirmwareUpdateScreenFooter
                    onUpdateConfirmation={handleUpdateConfirmation}
                    // Skip action is disabled for devices with unsupported (outdated) firmware.
                    onSkipUpdate={isDeviceFirmwareSupported ? handleSkipUpdate : undefined}
                />
            }
        >
            <FirmwareVersionCard isUpdateRequired={!isDeviceFirmwareSupported} />
        </DeviceOnboardingScreenWithExitButton>
    );
};
