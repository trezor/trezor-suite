import { FirmwareInstallationScreenContent } from '@suite-native/firmware';

import { DeviceOnboardingExitButtonScreenHeader } from '../components/DeviceOnboardingScreenWithExitButton';
import { useExitAlert } from '../hooks/useExitAlert';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

export const FirmwareInstallationScreen = () => {
    const { handleExitButtonPress } = useExitAlert();
    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();

    return (
        <FirmwareInstallationScreenContent
            customHeader={<DeviceOnboardingExitButtonScreenHeader />}
            onCancelAction={handleExitButtonPress}
            onFirmwareInstallationSuccess={navigateToNextScreenAfterFirmwareInstallation}
            isRetryAllowed={false}
            isTemporaryRememeberAllowed={false}
            navigationLocation="onboarding"
        />
    );
};
