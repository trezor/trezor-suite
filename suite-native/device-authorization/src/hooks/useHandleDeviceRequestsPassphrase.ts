import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import TrezorConnect, { UI } from '@trezor/connect';
import {
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
} from '@suite-native/navigation';
import { selectDeviceState } from '@suite-common/wallet-core';

import {
    selectDeviceRequestedPassphrase,
    selectIsCreatingNewPassphraseWallet,
    selectIsVerifyingPassphraseOnEmptyWallet,
} from '../deviceAuthorizationSlice';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const useHandleDeviceRequestsPassphrase = () => {
    const navigation = useNavigation<NavigationProp>();

    const deviceState = useSelector(selectDeviceState);
    const deviceRequestedPassphrase = useSelector(selectDeviceRequestedPassphrase);
    const isVefifyingPassphraseOnEmptyWallet = useSelector(
        selectIsVerifyingPassphraseOnEmptyWallet,
    );
    const isCreatingNewWallet = useSelector(selectIsCreatingNewPassphraseWallet);

    const handleRequestPassphrase = useCallback(() => {
        // If the passphrase request was while verifying empty passphrase wallet, we handle it separately in the screen
        if (!isVefifyingPassphraseOnEmptyWallet && !deviceState?.staticSessionId) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.PassphraseForm,
            });
        }

        // Feature requests passphrase
        if (
            !isVefifyingPassphraseOnEmptyWallet &&
            !isCreatingNewWallet &&
            deviceState?.staticSessionId
        ) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.PassphraseFeatureUnlockForm,
            });
        }
    }, [
        deviceState?.staticSessionId,
        isCreatingNewWallet,
        isVefifyingPassphraseOnEmptyWallet,
        navigation,
    ]);

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
