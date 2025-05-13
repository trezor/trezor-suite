import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import { selectDeviceModel } from '@suite-common/wallet-core';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { selectIsDeviceAuthenticityCheckEnabled } from '@suite-native/settings';
import { DeviceModelInternal } from '@trezor/device-utils';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    DeviceOnboardingStackParamList
>;

export const useNavigateToNextScreenAfterFirmwareInstallation = () => {
    const navigation = useNavigation<NavigationProps>();
    const deviceModel = useSelector(selectDeviceModel);
    const isDeviceAuthenticityCheckEnabled = useSelector(selectIsDeviceAuthenticityCheckEnabled);

    const supportsDeviceAuthentication = deviceModel
        ? SUPPORTS_DEVICE_AUTHENTICITY_CHECK[deviceModel]
        : true; // We must require device authenticity check so it cannot be used as an exploit to bypass it

    const shouldAuthenticateSelectedDevice =
        supportsDeviceAuthentication && isDeviceAuthenticityCheckEnabled;

    const navigateToNextScreenAfterFirmwareInstallation = () => {
        if (deviceModel === DeviceModelInternal.T2T1) {
            // T2T1 does not support device tutorial and device authenticity check so those screens are skipped.
            navigation.navigate(DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads);
        } else {
            navigation.navigate(
                shouldAuthenticateSelectedDevice
                    ? DeviceOnboardingStackRoutes.DeviceAuthenticity
                    : DeviceOnboardingStackRoutes.DeviceTutorial,
            );
        }
    };

    return { navigateToNextScreenAfterFirmwareInstallation };
};
