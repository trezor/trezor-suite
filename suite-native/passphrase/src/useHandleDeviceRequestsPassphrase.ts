import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import TrezorConnect, { UI } from '@trezor/connect';
import {
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { selectDeviceState } from '@suite-common/wallet-core';

import { selectIsVerifyingPassphraseOnEmptyWallet } from './passphraseSlice';

type NavigationProp = StackToStackCompositeNavigationProps<
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
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
                navigation.navigate(RootStackRoutes.ConnectDeviceStack, {
                    screen: ConnectDeviceStackRoutes.PassphraseFeatureUnlockScreen,
                });
            } else {
                navigation.navigate(RootStackRoutes.ConnectDeviceStack, {
                    screen: ConnectDeviceStackRoutes.PassphraseForm,
                });
            }
        }
    }, [deviceState, isVefifyingPassphraseOnEmptyWallet, navigation]);

    useEffect(() => {
        TrezorConnect.on(UI.REQUEST_PASSPHRASE, handleNavigateToPassphraseForm);

        return () => TrezorConnect.off(UI.REQUEST_PASSPHRASE, handleNavigateToPassphraseForm);
    }, [handleNavigateToPassphraseForm]);
};
