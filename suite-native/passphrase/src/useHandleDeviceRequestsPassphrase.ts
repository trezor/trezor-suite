import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import TrezorConnect, { UI } from '@trezor/connect';
import {
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
} from '@suite-native/navigation';
import { selectDeviceState } from '@suite-common/wallet-core';
import { selectDeviceRequestedPassphrase } from '@suite-native/device-authorization';

import { selectIsVerifyingPassphraseOnEmptyWallet } from './passphraseSlice';

type NavigationProp = StackToStackCompositeNavigationProps<
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const useHandleDeviceRequestsPassphrase = () => {
    const navigation = useNavigation<NavigationProp>();

    const deviceState = useSelector(selectDeviceState);
    const deviceRequestedPassphrase = useSelector(selectDeviceRequestedPassphrase);
    const isVefifyingPassphraseOnEmptyWallet = useSelector(
        selectIsVerifyingPassphraseOnEmptyWallet,
    );

    const handleRequestPassphrase = useCallback(() => {
        // If the passphrase request was while verifying empty passphrase wallet, we handle it separately in the screen
        if (!isVefifyingPassphraseOnEmptyWallet && !deviceState) {
            navigation.navigate(RootStackRoutes.ConnectDeviceStack, {
                screen: ConnectDeviceStackRoutes.PassphraseForm,
            });
        }
        // Feature requests passphrase
        if (!isVefifyingPassphraseOnEmptyWallet && deviceState) {
            navigation.navigate(RootStackRoutes.ConnectDeviceStack, {
                screen: ConnectDeviceStackRoutes.PassphraseForm,
            });
        }
    }, [deviceState, isVefifyingPassphraseOnEmptyWallet, navigation]);

    useEffect(() => {
        if (deviceRequestedPassphrase) {
            handleRequestPassphrase();
        }
    }, [deviceRequestedPassphrase, handleRequestPassphrase]);

    const handleRequestPassphraseOnDevice = useCallback(() => {
        navigation.navigate(ConnectDeviceStackRoutes.PassphraseEnterOnTrezor);
    }, [navigation]);

    useEffect(() => {
        TrezorConnect.on(UI.REQUEST_PASSPHRASE_ON_DEVICE, handleRequestPassphraseOnDevice);

        return () =>
            TrezorConnect.off(UI.REQUEST_PASSPHRASE_ON_DEVICE, handleRequestPassphraseOnDevice);
    }, [handleRequestPassphraseOnDevice]);
};
