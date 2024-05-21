import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Button } from '@suite-native/atoms';
import { onPassphraseSubmit, selectDeviceInternalModel } from '@suite-common/wallet-core';
import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect, { DeviceModelInternal } from '@trezor/connect';
import { Translation } from '@suite-native/intl';
import { Icon, IconName } from '@suite-common/icons';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

const trezorIconNameMap = {
    [DeviceModelInternal.T1B1]: 'trezorT1B1',
    [DeviceModelInternal.T2B1]: 'trezorT2B1',
    [DeviceModelInternal.T2T1]: 'trezorT2T1',
    [DeviceModelInternal.T3T1]: 'trezorT2T1', // TODO replace with correct icon when available
} as const satisfies Record<DeviceModelInternal, IconName>;

export const EnterPassphraseOnTrezorButton = () => {
    const dispatch = useDispatch();

    const deviceModel = useSelector(selectDeviceInternalModel);

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

    if (!deviceModel) return null;

    return (
        <Button
            onPress={handleSubmitOnDevice}
            colorScheme="tertiaryElevation0"
            viewLeft={<Icon name={trezorIconNameMap[deviceModel]} />}
        >
            <Translation id="modulePassphrase.enterPassphraseOnTrezor.button" />
        </Button>
    );
};
