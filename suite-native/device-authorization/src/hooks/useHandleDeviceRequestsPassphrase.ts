import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    DiscoveryRootState,
    selectDiscoveryByDevicePath,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect, { UI } from '@trezor/connect';

import { selectDeviceRequestedPassphrase } from '../deviceAuthorizationSlice';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const useHandleDeviceRequestsPassphrase = () => {
    const navigation = useNavigation<NavigationProp>();

    const selectedDevice = useSelector(selectSelectedDevice);
    const discovery = useSelector((state: DiscoveryRootState) =>
        selectDiscoveryByDevicePath(state, selectedDevice?.path),
    );
    const deviceRequestedPassphrase = useSelector(selectDeviceRequestedPassphrase);

    const handleRequestPassphrase = useCallback(() => {
        // If the passphrase request was while verifying empty passphrase wallet, we handle it separately in the screen
        if (discovery?.isAddingHiddenWallet) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.PassphraseForm,
            });

            return;
        }

        // Feature requests passphrase
        if (
            discovery &&
            !discovery.isAddingHiddenWallet &&
            selectedDevice?.state?.staticSessionId
        ) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.PassphraseFeatureUnlockForm,
            });
        }
    }, [selectedDevice?.state?.staticSessionId, navigation, discovery]);

    useEffect(() => {
        if (deviceRequestedPassphrase) {
            handleRequestPassphrase();
        }
    }, [deviceRequestedPassphrase, handleRequestPassphrase]);

    const handleRequestPassphraseOnDevice = useCallback(() => {
        navigation.navigate(AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor);
    }, [navigation]);

    useEffect(() => {
        TrezorConnect.on(UI.REQUEST_PASSPHRASE_ON_DEVICE, handleRequestPassphraseOnDevice);

        return () =>
            TrezorConnect.off(UI.REQUEST_PASSPHRASE_ON_DEVICE, handleRequestPassphraseOnDevice);
    }, [handleRequestPassphraseOnDevice]);
};
