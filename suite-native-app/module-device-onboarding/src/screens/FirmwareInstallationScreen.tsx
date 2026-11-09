import { FirmwareInstallationScreenContent } from '@suite-native/firmware';

import { useExitAlert } from '../hooks/useExitAlert';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

export const FirmwareInstallationScreen = () => {
    const { handleExitButtonPress } = useExitAlert();
    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();

    return (
        <FirmwareInstallationScreenContent
            onCancelAction={handleExitButtonPress}
            onFirmwareInstallationSuccess={navigateToNextScreenAfterFirmwareInstallation}
            isTemporaryRememeberAllowed={false}
            navigationLocation="onboarding"
        />
    );
};
