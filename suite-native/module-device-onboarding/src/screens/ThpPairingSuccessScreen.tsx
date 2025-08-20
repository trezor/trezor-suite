import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { nativeFirmwareActions } from '@suite-native/firmware';
import { ThpPairingSuccessScreenContent } from '@suite-native/thp';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

export const ThpPairingSuccessScreen = () => {
    const dispatch = useDispatch();
    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();

    useEffect(() => {
        dispatch(nativeFirmwareActions.setIsFirmwareInstallationRunning(false));
    }, [dispatch]);

    return (
        <DeviceOnboardingScreenWithExitButton>
            <ThpPairingSuccessScreenContent
                onContinue={navigateToNextScreenAfterFirmwareInstallation}
            />
        </DeviceOnboardingScreenWithExitButton>
    );
};
