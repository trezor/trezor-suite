import { FirmwareInstallationScreenContent } from '@suite-native/firmware';
import { ScreenHeader, useNavigationRemoveActionInterceptor } from '@suite-native/navigation';

import { useExitAlert } from '../hooks/useExitAlert';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

const FirmwareInstallationScreenHeader = ({
    handleExitButtonPress,
}: {
    handleExitButtonPress: () => void;
}) => <ScreenHeader closeActionType="close" closeAction={handleExitButtonPress} />;

export const FirmwareInstallationScreen = () => {
    const { handleExitButtonPress } = useExitAlert();
    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();

    useNavigationRemoveActionInterceptor({ onInterceptedAction: handleExitButtonPress });

    return (
        <FirmwareInstallationScreenContent
            customHeader={
                <FirmwareInstallationScreenHeader handleExitButtonPress={handleExitButtonPress} />
            }
            onCancelAction={handleExitButtonPress}
            onFirmwareInstallationSuccess={navigateToNextScreenAfterFirmwareInstallation}
            isTemporaryRememeberAllowed={false}
            navigationLocation="onboarding"
        />
    );
};
