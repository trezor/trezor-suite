import { useSelector } from 'react-redux';

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

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';

export const ConfirmFirmwareUpdateScreen = ({
    navigation,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate
>) => {
    const isDeviceFirmwareSupported = useSelector(selectIsDeviceFirmwareSupported);

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
