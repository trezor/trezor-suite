import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceModel, selectDeviceUnavailableCapabilities } from '@suite-common/device';
import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import { selectThpStep } from '@suite-common/thp';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type StackToStackCompositeNavigationProps,
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
            navigation.replace(DeviceOnboardingStackRoutes.ThpPairingInfo);
        } else if (isDeviceTutorialSupported) {
            navigation.replace(
                shouldAuthenticateSelectedDevice
                    ? DeviceOnboardingStackRoutes.DeviceAuthenticity
                    : DeviceOnboardingStackRoutes.DeviceTutorial,
            );
        } else {
            navigation.replace(DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads);
        }
    };

    return { navigateToNextScreenAfterFirmwareInstallation };
};
