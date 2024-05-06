import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import TrezorConnect from '@trezor/connect';
import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { selectDeviceState } from '@suite-common/wallet-core';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const useHandleDeviceRequestsPassphrase = () => {
    const navigation = useNavigation<NavigationProp>();

    const deviceState = useSelector(selectDeviceState);

    const handleNavigateToPassphraseForm = useCallback(() => {
        if (deviceState) {
            // If device already has a state, it means it's already been authorized with passphrase
            // and we are trying to verify that user has correct passphrase that has been used to authorize this wallet
            navigation.navigate(RootStackRoutes.PassphraseStack, {
                screen: PassphraseStackRoutes.PassphraseVerifyEmptyWallet,
            });
        } else {
            navigation.navigate(RootStackRoutes.PassphraseStack, {
                screen: PassphraseStackRoutes.PassphraseForm,
            });
        }
    }, [deviceState, navigation]);

    useEffect(() => {
        TrezorConnect.on('ui-request_passphrase', handleNavigateToPassphraseForm);

        return () => TrezorConnect.off('ui-request_passphrase', handleNavigateToPassphraseForm);
    }, [handleNavigateToPassphraseForm]);
};
