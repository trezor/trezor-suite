import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { firmwareActions } from '@suite-common/firmware';
import { FirmwareInstallationScreenContent } from '@suite-native/firmware';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

export const FirmwareInstallationScreen = () => {
    const dispatch = useDispatch();
    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();

    useEffect(() => {
        // On first render, set the firmware installation status to 'initial'. Some previous failed firmware updates might
        // happened before and we want do avoid showing the "firmware update failed" UI when user returns to this screen.
        dispatch(firmwareActions.setStatus('initial'));
    }, [dispatch]);

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
