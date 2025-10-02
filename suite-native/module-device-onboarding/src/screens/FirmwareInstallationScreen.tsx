import { FirmwareInstallationScreenContent } from '@suite-native/firmware';
import { ScreenHeader, useOverrideBackNavigation } from '@suite-native/navigation';

import { useExitAlert } from '../hooks/useExitAlert';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

const FirmwareInstallationScreenHeader = () => {
    const { handleExitButtonPress } = useExitAlert();
    useOverrideBackNavigation({ onNavigateBack: handleExitButtonPress });

    return <ScreenHeader closeActionType="close" closeAction={handleExitButtonPress} />;
};

export const FirmwareInstallationScreen = () => {
    const { handleExitButtonPress } = useExitAlert();
    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();
    useOverrideBackNavigation();

    return (
        <FirmwareInstallationScreenContent
            customHeader={<FirmwareInstallationScreenHeader />}
            onCancelAction={handleExitButtonPress}
            onFirmwareInstallationSuccess={navigateToNextScreenAfterFirmwareInstallation}
            isTemporaryRememeberAllowed={false}
            navigationLocation="onboarding"
        />
    );
};
