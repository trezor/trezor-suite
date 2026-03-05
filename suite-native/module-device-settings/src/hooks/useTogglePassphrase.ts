import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceProtectedByPassphrase, selectSelectedDevice } from '@suite-common/device';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';

export const useTogglePassphrase = () => {
    const navigation = useNavigation();
    const { showToast } = useToast();

    const device = useSelector(selectSelectedDevice);
    const isPassphraseEnabled = useSelector(selectIsDeviceProtectedByPassphrase);

    const togglePassphrase = async () => {
        if (!device) {
            return;
        }

        const response = await TrezorConnect.applySettings({
            device: {
                path: device.path,
            },
            use_passphrase: !isPassphraseEnabled,
        });
        navigation.goBack();

        if (!response.success) {
            showToast({
                variant: 'default',
                message: response.error.message,
                icon: 'check',
            });
        }
    };

    return { togglePassphrase };
};
