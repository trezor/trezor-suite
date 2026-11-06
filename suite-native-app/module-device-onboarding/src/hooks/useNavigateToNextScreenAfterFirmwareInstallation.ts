import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceUnavailableCapabilities, selectSelectedDevice } from '@suite-common/device';
import { selectIsDeviceAuthenticityCheckRequired } from '@suite-common/device-authenticity';
import { type PersistentDeviceDataRootState } from '@suite-common/persistent-device-data';
import { selectThpStep } from '@suite-common/thp';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { selectDeviceAuthenticityCheckSettings } from '@suite-native/settings';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    DeviceOnboardingStackParamList
>;

export const useNavigateToNextScreenAfterFirmwareInstallation = () => {
    const navigation = useNavigation<NavigationProps>();

    const device = useSelector(selectSelectedDevice);
    const thpStep = useSelector(selectThpStep);
    const deviceUnavailableCapabilities = useSelector(selectDeviceUnavailableCapabilities);
    const deviceAuthenticityCheckSettings = useSelector(selectDeviceAuthenticityCheckSettings);
    const isDeviceAuthenticityCheckRequired = useSelector((state: PersistentDeviceDataRootState) =>
        selectIsDeviceAuthenticityCheckRequired(state, device, deviceAuthenticityCheckSettings),
    );

    const isDeviceTutorialSupported = !deviceUnavailableCapabilities?.tutorial;

    const navigateToNextScreenAfterFirmwareInstallation = () => {
        if (thpStep === 'BeforeConnectionInfo') {
            navigation.replace(DeviceOnboardingStackRoutes.ThpPairingInfo);
        } else if (isDeviceTutorialSupported) {
            navigation.replace(
                isDeviceAuthenticityCheckRequired
                    ? DeviceOnboardingStackRoutes.DeviceAuthenticity
                    : DeviceOnboardingStackRoutes.DeviceTutorial,
            );
        } else {
            navigation.replace(DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads);
        }
    };

    return { navigateToNextScreenAfterFirmwareInstallation };
};
