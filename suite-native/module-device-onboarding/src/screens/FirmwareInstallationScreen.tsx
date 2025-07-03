import { FirmwareInstallationScreenContent } from '@suite-native/firmware';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

export const FirmwareInstallationScreen = () => {
    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();

    return (
        <DeviceOnboardingScreenWithExitButton>
            <FirmwareInstallationScreenContent
                onFirmwareInstallationSuccess={navigateToNextScreenAfterFirmwareInstallation}
                isCancellationAllowed={false}
                isRetryAllowed={false}
                isTemporaryRememeberAllowed={false}
                navigationLocation="onboarding"
            />
        </DeviceOnboardingScreenWithExitButton>
    );
};
