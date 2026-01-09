import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    selectDeviceInternalModel,
    selectSelectedDevice,
    submitPassphrase,
} from '@suite-common/wallet-core';
import { EventType } from '@suite-native/analytics';
import { Button } from '@suite-native/atoms';
import { setInputPassphraseOnDevice } from '@suite-native/device-authorization';
import { DeviceModelIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useLegacyAnalytics } from '@suite-native/services';
import TrezorConnect, { UI } from '@trezor/connect';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor,
    RootStackParamList
>;

export const EnterPassphraseOnTrezorButton = () => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const legacyAnalytics = useLegacyAnalytics();
    const deviceModel = useSelector(selectDeviceInternalModel);

    const navigation = useNavigation<NavigationProp>();

    const handleRedirectToEnterOnTrezor = useCallback(() => {
        navigation.navigate(AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor);
    }, [navigation]);

    useEffect(() => {
        TrezorConnect.on(UI.REQUEST_PASSPHRASE_ON_DEVICE, handleRedirectToEnterOnTrezor);

        return () =>
            TrezorConnect.off(UI.REQUEST_PASSPHRASE_ON_DEVICE, handleRedirectToEnterOnTrezor);
    }, [handleRedirectToEnterOnTrezor]);

    const handleSubmitOnDevice = () => {
        legacyAnalytics.report({ type: EventType.PassphraseEnterOnTrezor });
        if (!device) return;
        dispatch(setInputPassphraseOnDevice(true));
        dispatch(submitPassphrase({ device, passphrase: '', passphraseOnDevice: true }));
    };

    if (!deviceModel || !device) return null;

    return (
        <Button
            onPress={handleSubmitOnDevice}
            colorScheme="tertiaryElevation0"
            viewLeft={<DeviceModelIcon deviceModel={deviceModel} />}
        >
            <Translation id="modulePassphrase.enterPassphraseOnTrezor.button" />
        </Button>
    );
};
