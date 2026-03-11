import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    deviceActions,
    selectIsDeviceInitialized,
    selectSelectedDevice,
} from '@suite-common/device';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { selectIsAnyNetworkEnabled } from '@suite-common/wallet-core';
import { selectIsDeviceSetupSupported } from '@suite-native/device';
import {
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

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
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProps>();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isDeviceSetupSupported = useSelector(selectIsDeviceSetupSupported);
    const isAnyNetworkEnabled = useSelector(selectIsAnyNetworkEnabled);
    const device = useSelector(selectSelectedDevice);

    const dismissCheck = () => {
        if (device?.id) {
            dispatch(deviceActions.dismissFirmwareAuthenticityCheck(device.id));
        }
    };

    const handleClose = () => {
        dismissCheck();

        if (!isDeviceInitialized && isDeviceSetupSupported) {
            navigation.popTo(RootStackRoutes.DeviceOnboardingStack, {
                screen: DeviceOnboardingStackRoutes.UninitializedDeviceLanding,
                params: {
                    deviceModel: getDeviceInternalModel(device),
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
