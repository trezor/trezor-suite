import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import { selectThpStep } from '@suite-common/thp';
import { selectDeviceModel, selectDeviceUnavailableCapabilities } from '@suite-common/wallet-core';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { selectIsDeviceAuthenticityCheckEnabled } from '@suite-native/settings';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    DeviceOnboardingStackParamList
>;

export const useNavigateToNextScreenAfterFirmwareInstallation = () => {
    const navigation = useNavigation<NavigationProps>();

    const deviceModel = useSelector(selectDeviceModel);
    const thpStep = useSelector(selectThpStep);
    const deviceUnavailableCapabilities = useSelector(selectDeviceUnavailableCapabilities);
    const isDeviceAuthenticityCheckEnabled = useSelector(selectIsDeviceAuthenticityCheckEnabled);

    const isDeviceTutorialSupported = !deviceUnavailableCapabilities?.tutorial;
    const supportsDeviceAuthentication = deviceModel
        ? SUPPORTS_DEVICE_AUTHENTICITY_CHECK[deviceModel]
        : true; // We must require device authenticity check so it cannot be used as an exploit to bypass it
    const shouldAuthenticateSelectedDevice =
        supportsDeviceAuthentication && isDeviceAuthenticityCheckEnabled;

    const navigateToNextScreenAfterFirmwareInstallation = () => {
        if (thpStep === 'BeforeConnectionInfo') {
            navigation.navigate(DeviceOnboardingStackRoutes.ThpPairingInfo);
        } else if (isDeviceTutorialSupported) {
            navigation.navigate(
                shouldAuthenticateSelectedDevice
                    ? DeviceOnboardingStackRoutes.DeviceAuthenticity
                    : DeviceOnboardingStackRoutes.DeviceTutorial,
            );
        } else {
            navigation.navigate(DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads);
        }
    };

    return { navigateToNextScreenAfterFirmwareInstallation };
};
