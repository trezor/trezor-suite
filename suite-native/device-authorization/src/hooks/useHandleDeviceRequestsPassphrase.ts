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

import {
    selectDeviceRequestedPassphrase,
    selectInputPassphraseOnDevice,
} from '../deviceAuthorizationSlice';

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
};
