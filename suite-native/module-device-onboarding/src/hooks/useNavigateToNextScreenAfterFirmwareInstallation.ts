import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceUnavailableCapabilities, selectSelectedDevice } from '@suite-common/device';
import { selectShouldCheckDeviceAuthenticity } from '@suite-common/device-authenticity';
import { type PersistentDeviceDataRootState } from '@suite-common/persistent-device-data';
import { injectGetDeviceAuthenticityCheckSettings } from '@suite-common/suite-types';
import { selectThpStep } from '@suite-common/thp';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useGetter } from '@trezor/dependency-injection';

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
    const deviceAuthenticityCheckSettings = useGetter(injectGetDeviceAuthenticityCheckSettings);
    // Skipped also if the check has already succeeded for this device.
    const shouldAuthenticateSelectedDevice = useSelector((state: PersistentDeviceDataRootState) =>
        selectShouldCheckDeviceAuthenticity(state, device, deviceAuthenticityCheckSettings),
    );

    const isDeviceTutorialSupported = !deviceUnavailableCapabilities?.tutorial;

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
