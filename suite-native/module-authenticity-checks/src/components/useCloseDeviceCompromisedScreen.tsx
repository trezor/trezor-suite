import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceInitialized, selectSelectedDevice } from '@suite-common/device';
import { selectDeviceNeedsInteractiveDeviceChecks } from '@suite-common/device-authenticity';
import { type PersistentDeviceDataRootState } from '@suite-common/persistent-device-data';
import { injectGetDeviceAuthenticityCheckSettings } from '@suite-common/suite-types';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { selectIsAnyNetworkEnabled } from '@suite-common/wallet-core';
import { selectIsDeviceSetupSupported } from '@suite-native/device';
import {
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useGetter } from '@trezor/dependency-injection';

type NavigationProps = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.DeviceCompromisedModal,
    RootStackParamList
>;

/**
 * Functionality to navigate to the appropriate next screen based on the current state, because navigation
 * to the Device Compromised screen can occur inbetween different flows.
 */
export const useCloseDeviceCompromisedScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isDeviceSetupSupported = useSelector(selectIsDeviceSetupSupported);
    const isAnyNetworkEnabled = useSelector(selectIsAnyNetworkEnabled);
    const device = useSelector(selectSelectedDevice);
    const deviceAuthenticityCheckSettings = useGetter(injectGetDeviceAuthenticityCheckSettings);
    const doesDeviceNeedInteractiveDeviceChecks = useSelector(
        (state: PersistentDeviceDataRootState) =>
            selectDeviceNeedsInteractiveDeviceChecks(
                state,
                device,
                deviceAuthenticityCheckSettings,
            ),
    );

    const deviceModel = getDeviceInternalModel(device);
    const shouldEnterDeviceOnboarding = isDeviceInitialized
        ? doesDeviceNeedInteractiveDeviceChecks
        : isDeviceSetupSupported;

    const handleClose = () => {
        if (shouldEnterDeviceOnboarding) {
            navigation.popTo(RootStackRoutes.DeviceOnboardingStack, {
                screen: DeviceOnboardingStackRoutes.ManualDeviceCheck,
                params: {
                    deviceModel,
                },
            });
        } else if (!isAnyNetworkEnabled) {
            navigation.popTo(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.CoinEnablingInit,
            });
        } else {
            navigateToInitialScreen();
        }
    };

    return {
        handleClose,
    };
};
