import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { nativeFirmwareActions } from '@suite-native/firmware';
import { ThpPairingSuccessScreenContent } from '@suite-native/thp';

import { NonClosableDeviceOnboardingScreen } from '../components/NonClosableDeviceOnboardingScreen';
import { useNavigateToNextScreenAfterFirmwareInstallation } from '../hooks/useNavigateToNextScreenAfterFirmwareInstallation';

export const ThpPairingSuccessScreen = () => {
    const { dispatch } = useServices(selectDispatch);
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
