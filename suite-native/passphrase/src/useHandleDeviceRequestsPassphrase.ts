import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import TrezorConnect, { UI } from '@trezor/connect';
import {
    RootStackParamList,
    RootStackRoutes,
    PassphraseStackParamList,
    StackToStackCompositeNavigationProps,
    PassphraseStackRoutes,
} from '@suite-native/navigation';
import { selectDeviceState } from '@suite-common/wallet-core';

import { selectIsVerifyingPassphraseOnEmptyWallet } from './passphraseSlice';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const useHandleDeviceRequestsPassphrase = () => {
    const navigation = useNavigation<NavigationProp>();

    const deviceState = useSelector(selectDeviceState);
    const isVefifyingPassphraseOnEmptyWallet = useSelector(
        selectIsVerifyingPassphraseOnEmptyWallet,
    );

    const handleRequestPassphrase = useCallback(() => {
        // If the passphrase request was while verifying empty passphrase wallet, we handle it separately in the screen
        if (!isVefifyingPassphraseOnEmptyWallet && !deviceState) {
            navigation.navigate(RootStackRoutes.PassphraseStack, {
                screen: PassphraseStackRoutes.PassphraseForm,
            });
        }
    }, [deviceState, isVefifyingPassphraseOnEmptyWallet, navigation]);

    useEffect(() => {
        TrezorConnect.on(UI.REQUEST_PASSPHRASE, handleRequestPassphrase);

        return () => TrezorConnect.off(UI.REQUEST_PASSPHRASE, handleRequestPassphrase);
    }, [handleRequestPassphrase]);

    const handleRequestPassphraseOnDevice = useCallback(() => {
        navigation.navigate(PassphraseStackRoutes.PassphraseEnterOnTrezor);
    }, [navigation]);

    useEffect(() => {
        TrezorConnect.on(UI.REQUEST_PASSPHRASE_ON_DEVICE, handleRequestPassphraseOnDevice);

        return () =>
            TrezorConnect.off(UI.REQUEST_PASSPHRASE_ON_DEVICE, handleRequestPassphraseOnDevice);
    }, [handleRequestPassphraseOnDevice]);
};
