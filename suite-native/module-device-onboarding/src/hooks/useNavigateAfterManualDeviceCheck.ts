import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { useSetAtom } from 'jotai';

import {
    selectHasDeviceFirmwareInstalled,
    selectIsDeviceInitialized,
    selectSelectedDevice,
    selectShouldOfferUpdateFirmware,
} from '@suite-common/device';
import { selectShouldCheckDeviceAuthenticity } from '@suite-common/device-authenticity';
import { type PersistentDeviceDataRootState } from '@suite-common/persistent-device-data';
import { injectGetDeviceAuthenticityCheckSettings } from '@suite-common/suite-types';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useGetter } from '@trezor/dependency-injection';

import { useExitDeviceOnboardingForInitializedDevice } from './useExitDeviceOnboardingForInitializedDevice';
import { useNavigateToNextScreenAfterFirmwareInstallation } from './useNavigateToNextScreenAfterFirmwareInstallation';
import { updateOnboardingAnalyticsAtom } from '../../atoms';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.ManualDeviceCheck,
    RootStackParamList
>;

/**
 * Navigation to the next step once the Manual Device Check has been passed, either just now or previously.
 */
export const useNavigateAfterManualDeviceCheck = () => {
    const navigation = useNavigation<NavigationProps>();
    const device = useSelector(selectSelectedDevice);
    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);
    const shouldOfferUpdateFirmware = useSelector(selectShouldOfferUpdateFirmware);
    const deviceAuthenticityCheckSettings = useGetter(injectGetDeviceAuthenticityCheckSettings);
    const shouldCheckDeviceAuthenticity = useSelector((state: PersistentDeviceDataRootState) =>
        selectShouldCheckDeviceAuthenticity(state, device, deviceAuthenticityCheckSettings),
    );
    const updateOnboardingAnalytics = useSetAtom(updateOnboardingAnalyticsAtom);

    const { navigateToNextScreenAfterFirmwareInstallation } =
        useNavigateToNextScreenAfterFirmwareInstallation();
    const { exitDeviceOnboardingForInitializedDevice } =
        useExitDeviceOnboardingForInitializedDevice();

    const navigateAfterManualDeviceCheck = () => {
        // Initialized device only needs to pass the interactive device checks, the rest of the onboarding is skipped.
        if (isDeviceInitialized) {
            if (shouldCheckDeviceAuthenticity) {
                navigation.replace(DeviceOnboardingStackRoutes.DeviceAuthenticity);
            } else {
                exitDeviceOnboardingForInitializedDevice();
            }

            return;
        }

        if (!hasDeviceFirmwareInstalled) {
            // Manual Device Check has a 2nd step for devices without firmware (fresh or factory-reset).
            navigation.replace(DeviceOnboardingStackRoutes.ManualDeviceCheckWithoutFirmware);

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

    return { navigateAfterManualDeviceCheck };
};
