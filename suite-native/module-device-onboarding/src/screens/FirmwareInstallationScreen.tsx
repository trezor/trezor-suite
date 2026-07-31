import { FirmwareInstallationScreenContent } from '@suite-native/firmware';
import { ScreenHeader, useNavigationRemoveActionInterceptor } from '@suite-native/navigation';

import { useExitAlert } from '../hooks/useExitAlert';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

export const FirmwareInstallationScreen = () => {
    const { handleExitButtonPress } = useExitAlert();
    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();

    useNavigationRemoveActionInterceptor({ onInterceptedAction: handleExitButtonPress });

    return (
        <FirmwareInstallationScreenContent
            customHeader={
                <ScreenHeader closeActionType="close" closeAction={handleExitButtonPress} />
            }
            onCancelAction={handleExitButtonPress}
            onFirmwareInstallationSuccess={navigateToNextScreenAfterFirmwareInstallation}
            isTemporaryRememeberAllowed={false}
            navigationLocation="onboarding"
        />
    );
};
