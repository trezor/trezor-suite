import { useCallback, useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import TrezorConnect from '@trezor/connect';
import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const useHandleDeviceRequestsPassphrase = () => {
    const navigation = useNavigation<NavigationProp>();

    const handleNavigateToPassphraseForm = useCallback(() => {
        navigation.navigate(RootStackRoutes.PassphraseStack, {
            screen: PassphraseStackRoutes.PassphraseForm,
        });
    }, [navigation]);

    useEffect(() => {
        TrezorConnect.on('ui-request_passphrase', handleNavigateToPassphraseForm);

        return () => TrezorConnect.off('ui-request_passphrase', handleNavigateToPassphraseForm);
    }, [handleNavigateToPassphraseForm]);
};
