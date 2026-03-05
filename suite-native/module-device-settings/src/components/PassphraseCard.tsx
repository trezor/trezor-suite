import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceProtectedByPassphrase, selectSelectedDevice } from '@suite-common/device';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';

type NavigationProp = StackNavigationProps<DeviceSettingsStackParamList, DeviceSettingsStackRoutes>;

export const PassphraseCard = () => {
    const navigation = useNavigation<NavigationProp>();
    const device = useSelector(selectSelectedDevice);
    const isPassphraseEnabled = useSelector(selectIsDeviceProtectedByPassphrase);
    const { showToast } = useToast();

    if (!device) return null;

    const togglePassphrase = async () => {
        navigation.navigate(DeviceSettingsStackRoutes.DevicePassphraseStack);
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

    return (
        <TouchableSwitchRow
            isChecked={isPassphraseEnabled}
            onChange={togglePassphrase}
            icon="password"
            accessibilityLabel="passphrase"
            text={<Translation id="moduleDeviceSettings.passphrase.title" />}
            description={<Translation id="moduleDeviceSettings.passphrase.description" />}
            testID="@device-passphrase/passphrase"
        />
    );
};
