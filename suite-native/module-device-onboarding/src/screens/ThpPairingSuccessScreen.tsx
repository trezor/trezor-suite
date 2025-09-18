import { useDispatch } from 'react-redux';

import { nativeFirmwareActions } from '@suite-native/firmware';
import { ThpPairingSuccessScreenContent } from '@suite-native/thp';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

export const ThpPairingSuccessScreen = () => {
    const dispatch = useDispatch();
    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();

    const onContinue = () => {
        dispatch(nativeFirmwareActions.setIsFirmwareInstallationRunning(false));
        navigateToNextScreenAfterFirmwareInstallation();
    };

    return (
        <DeviceOnboardingScreenWithExitButton>
            <ThpPairingSuccessScreenContent onContinue={onContinue} />
        </DeviceOnboardingScreenWithExitButton>
    );
};
