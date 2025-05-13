import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import { selectHasDeviceFirmwareInstalled } from '@suite-common/wallet-core';
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

import { updateOnboardingAnalyticsAtom } from '../../atoms';
import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';
export const ConfirmFirmwareUpdateScreen = ({
    navigation,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate
>) => {
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);
    const isDeviceFirmwareSupported = useSelector(selectIsDeviceFirmwareSupported);
    const updateOnboardingAnalytics = useSetAtom(updateOnboardingAnalyticsAtom);

    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();

    const handleUpdateConfirmation = () => {
        updateOnboardingAnalytics({
            firmware: hasDeviceFirmwareInstalled ? 'update' : 'install',
        });
        navigation.navigate(DeviceOnboardingStackRoutes.FirmwareInstallation);
    };

    const handleSkipUpdate = () => {
        updateOnboardingAnalytics({
            firmware: 'skip',
        });
        navigateToNextScreenAfterFirmwareInstallation();
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
