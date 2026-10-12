import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    deviceActions,
    selectIsDeviceInitialized,
    selectSelectedDevice,
} from '@suite-common/device';
import { injectDispatch } from '@suite-common/redux-utils';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { ejectAllWalletsThunk, selectIsAnyNetworkEnabled } from '@suite-common/wallet-core';
import { selectIsDeviceSetupSupported } from '@suite-native/device';
import {
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

type NavigationProps = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.DeviceCompromisedModal,
    RootStackParamList
>;

/**
 * Functionality to navigate to the appropriate next screen based on the current state, because navigation
 * to the Device Compromised screen can occur inbetween different flows.
 */
export const useCloseDeviceCompromisedScreen = ({
    dismissedCheck = 'firmware-authenticity',
}: { dismissedCheck?: 'firmware-authenticity' | 'entropy-discovery' } = {}) => {
    const { dispatch } = useServices(injectDispatch);

    const navigation = useNavigation<NavigationProps>();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const isDeviceInitialized = useSelector(selectIsDeviceInitialized);
    const isDeviceSetupSupported = useSelector(selectIsDeviceSetupSupported);
    const isAnyNetworkEnabled = useSelector(selectIsAnyNetworkEnabled);
    const device = useSelector(selectSelectedDevice);

    const dismissCheck = () => {
        if (!device?.id) return;
        if (dismissedCheck === 'entropy-discovery') {
            dispatch(deviceActions.dismissDiscoveryEntropyCheck(device.id));
            // The device returned a wrong xpub, so nothing it has ever returned can be trusted. See the thunk description.
            dispatch(ejectAllWalletsThunk({ device }));
        } else {
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
