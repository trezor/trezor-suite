import { useDispatch } from 'react-redux';
import { useCallback, useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Button } from '@suite-native/atoms';
import { onPassphraseSubmit } from '@suite-common/wallet-core';
import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';
import { Translation } from '@suite-native/intl';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const EnterPassphraseOnTrezorButton = () => {
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProp>();

    const handleRequestPassphraseOnDevice = useCallback(() => {
        navigation.navigate(PassphraseStackRoutes.PassphraseEnterOnTrezor);
    }, [navigation]);

    useEffect(() => {
        TrezorConnect.on('ui-request_passphrase_on_device', handleRequestPassphraseOnDevice);

        return () =>
            TrezorConnect.off('ui-request_passphrase_on_device', handleRequestPassphraseOnDevice);
    }, [handleRequestPassphraseOnDevice]);

    const handleSubmitOnDevice = () => {
        dispatch(onPassphraseSubmit({ value: '', passphraseOnDevice: true }));
    };

    return (
        <Button onPress={handleSubmitOnDevice} colorScheme="tertiaryElevation0">
            <Translation id="modulePassphrase.enterPassphraseOnTrezor.button" />
        </Button>
    );
};
