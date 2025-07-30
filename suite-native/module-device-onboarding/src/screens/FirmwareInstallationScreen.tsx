import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { firmwareActions } from '@suite-common/firmware';
import { FirmwareInstallationScreenContent } from '@suite-native/firmware';

import { DeviceOnboardingExitButtonScreenHeader } from '../components/DeviceOnboardingScreenWithExitButton';
import { useExitAlert } from '../hooks/useExitAlert';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

export const FirmwareInstallationScreen = () => {
    const dispatch = useDispatch();
    const { handleExitButtonPress } = useExitAlert();
    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();

    useEffect(() => {
        // On first render, set the firmware installation status to 'initial'. Some previous failed firmware updates might
        // happened before and we want do avoid showing the "firmware update failed" UI when user returns to this screen.
        dispatch(firmwareActions.setStatus('initial'));
    }, [dispatch]);

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
