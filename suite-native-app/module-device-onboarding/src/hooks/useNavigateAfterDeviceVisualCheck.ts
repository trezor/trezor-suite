import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { useSetAtom } from 'jotai';

import {
    selectHasDeviceFirmwareInstalled,
    selectIsDeviceInitialized,
    selectSelectedDevice,
    selectShouldOfferUpdateFirmware,
} from '@suite-common/device';
import { selectIsDeviceAuthenticityCheckRequired } from '@suite-common/device-authenticity';
import { type PersistentDeviceDataRootState } from '@suite-common/persistent-device-data';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { selectDeviceAuthenticityCheckSettings } from '@suite-native/settings';

import { useExitDeviceOnboardingForInitializedDevice } from './useExitDeviceOnboardingForInitializedDevice';
import { useNavigateToNextScreenAfterFirmwareInstallation } from './useNavigateToNextScreenAfterFirmwareInstallation';
import { updateOnboardingAnalyticsAtom } from '../../atoms';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.DeviceVisualCheck,
    RootStackParamList
>;

/**
 * Navigation to the next step once the Device Visual Check has been passed, either just now or previously.
 */
export const useNavigateAfterDeviceVisualCheck = () => {
    const navigation = useNavigation<NavigationProps>();
    const device = useSelector(selectSelectedDevice);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);
    const shouldOfferUpdateFirmware = useSelector(selectShouldOfferUpdateFirmware);
    const deviceAuthenticityCheckSettings = useSelector(selectDeviceAuthenticityCheckSettings);
    const isDeviceAuthenticityCheckRequired = useSelector((state: PersistentDeviceDataRootState) =>
        selectIsDeviceAuthenticityCheckRequired(state, device, deviceAuthenticityCheckSettings),
    );
    const updateOnboardingAnalytics = useSetAtom(updateOnboardingAnalyticsAtom);

    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();
    const { exitDeviceOnboardingForInitializedDevice } =
        useExitDeviceOnboardingForInitializedDevice();

    const navigateAfterDeviceVisualCheck = () => {
        if (isDeviceInitialized) {
            if (isDeviceAuthenticityCheckRequired) {
                navigation.replace(DeviceOnboardingStackRoutes.DeviceAuthenticity);
            } else {
                exitDeviceOnboardingForInitializedDevice();
            }

            return;
        }

        if (!hasDeviceFirmwareInstalled) {
            // Device Visual Check has a 2nd step for devices without firmware (fresh or factory-reset).
            navigation.replace(DeviceOnboardingStackRoutes.PackagingVisualCheck);

            return;
        }

        if (shouldOfferUpdateFirmware) {
            navigation.replace(DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate);

            return;
        }

        // If user already has the latest firmware installed, skip this update screen and navigate to device auth-check directly.
        updateOnboardingAnalytics({
            firmware: 'up-to-date',
        });
        navigateToNextScreenAfterFirmwareInstallation();
    };

    return { navigateAfterDeviceVisualCheck };
};
