import { FirmwareInstallationScreenContent } from '@suite-native/firmware';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackProps,
} from '@suite-native/navigation';

import { DeviceOnboardingScreenWithExitButton } from '../components/OnboardingScreenWithExitButton';

export const FirmwareInstallationScreen = ({
    navigation,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.FirmwareInstallation
>) => {
    const handleFirmwareInstallationSuccess = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.DeviceTutorial);
    };

    return (
        <DeviceOnboardingScreenWithExitButton>
            <FirmwareInstallationScreenContent
                onFirmwareInstallationSuccess={handleFirmwareInstallationSuccess}
                isCancellationAllowed={false}
                isRetryAllowed={false}
            />
        </DeviceOnboardingScreenWithExitButton>
    );
};
