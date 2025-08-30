import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    DiscoveryRootState,
    selectDiscoveryByDevicePath,
    selectSelectedDevice,
    selectDeviceRequestedPin,
} from '@suite-common/wallet-core';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
    useLastRouteName,
} from '@suite-native/navigation';

import {
    selectDeviceRequestedPassphrase,
    selectInputPassphraseOnDevice,
} from '../deviceAuthorizationSlice';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

const pinMatrixBlacklistedScreens = [
    RootStackRoutes.DeviceSettingsStack,
    RootStackRoutes.DeviceOnboardingStack,
];

export const useHandleDeviceAuthorization = () => {
    const navigation = useNavigation<NavigationProp>();
    const lastRoute = useLastRouteName();

    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    const selectedDevice = useSelector(selectSelectedDevice);
    const discovery = useSelector((state: DiscoveryRootState) =>
        selectDiscoveryByDevicePath(state, selectedDevice?.path),
    );
    const deviceRequestedPassphrase = useSelector(selectDeviceRequestedPassphrase);
    const inputPassphraseOnDevice = useSelector(selectInputPassphraseOnDevice);

    const handleRequestPassphrase = useCallback(() => {
        // NOTE: if the passphrase flow IS NOT in the beginning skip these calls
        if (discovery?.isAddingHiddenWallet) return;

        // Feature requests passphrase
        if (selectedDevice?.state?.staticSessionId) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.PassphraseFeatureUnlockForm,
            });
        }
    }, [discovery?.isAddingHiddenWallet, selectedDevice?.state?.staticSessionId, navigation]);

    useEffect(() => {
        if (deviceRequestedPassphrase) {
            handleRequestPassphrase();
        }
    }, [deviceRequestedPassphrase, handleRequestPassphrase]);

    const handleRequestPassphraseOnDevice = useCallback(() => {
        // NOTE: if the passphrase flow IS NOT in the beginning skip these calls
        if (discovery?.isAddingHiddenWallet) return;

        navigation.navigate(AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor);
    }, [discovery?.isAddingHiddenWallet, navigation]);

    useEffect(() => {
        if (inputPassphraseOnDevice) {
            handleRequestPassphraseOnDevice();
        }
    }, [inputPassphraseOnDevice, handleRequestPassphraseOnDevice]);

    const isOnPinMatrixBlacklistedRoute = pinMatrixBlacklistedScreens.includes(
        lastRoute as RootStackRoutes,
    );
    // When trezor gets locked, it is necessary to display a PIN matrix for T1 so that it can be unlocked
    // and then continue with the interaction. For non-T1 devices, PIN is entered on device, but the screen is still displayed.
    useEffect(() => {
        if (hasDeviceRequestedPin && !isOnPinMatrixBlacklistedRoute) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.PinMatrix,
            });
        }
    }, [hasDeviceRequestedPin, isOnPinMatrixBlacklistedRoute, navigation]);
};
