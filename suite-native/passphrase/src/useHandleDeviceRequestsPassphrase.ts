import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import TrezorConnect, { UI } from '@trezor/connect';
import {
    DeviceAuthenticationStackParamList,
    DeviceAuthenticationStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { selectDeviceState } from '@suite-common/wallet-core';

import { selectIsVerifyingPassphraseOnEmptyWallet } from './passphraseSlice';

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceAuthenticationStackParamList,
    DeviceAuthenticationStackRoutes,
    RootStackParamList
>;

export const useHandleDeviceRequestsPassphrase = () => {
    const navigation = useNavigation<NavigationProp>();

    const deviceState = useSelector(selectDeviceState);

    const isVefifyingPassphraseOnEmptyWallet = useSelector(
        selectIsVerifyingPassphraseOnEmptyWallet,
    );

    const handleNavigateToPassphraseForm = useCallback(() => {
        if (!isVefifyingPassphraseOnEmptyWallet) {
            if (deviceState) {
                navigation.navigate(RootStackRoutes.DeviceAuthenticationStack, {
                    screen: DeviceAuthenticationStackRoutes.PassphraseFeatureUnlockScreen,
                });
            } else {
                navigation.navigate(RootStackRoutes.DeviceAuthenticationStack, {
                    screen: DeviceAuthenticationStackRoutes.PassphraseForm,
                });
            }
        }
    }, [deviceState, isVefifyingPassphraseOnEmptyWallet, navigation]);

    useEffect(() => {
        TrezorConnect.on(UI.REQUEST_PASSPHRASE, handleNavigateToPassphraseForm);

        return () => TrezorConnect.off(UI.REQUEST_PASSPHRASE, handleNavigateToPassphraseForm);
    }, [handleNavigateToPassphraseForm]);
};
