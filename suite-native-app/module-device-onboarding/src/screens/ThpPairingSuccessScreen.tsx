import { nativeFirmwareActions } from '@suite-native/firmware';
import { ThpPairingSuccessScreenContent } from '@suite-native/thp';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { NonClosableDeviceOnboardingScreen } from '../components/NonClosableDeviceOnboardingScreen';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

export const ThpPairingSuccessScreen = () => {
    const { dispatch } = useServices(injectDispatch);
    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();

    const onContinue = () => {
        dispatch(nativeFirmwareActions.setIsFirmwareInstallationRunning(false));
        navigateToNextScreenAfterFirmwareInstallation();
    };

    return (
        <NonClosableDeviceOnboardingScreen>
            <ThpPairingSuccessScreenContent onContinue={onContinue} />
        </NonClosableDeviceOnboardingScreen>
    );
};
