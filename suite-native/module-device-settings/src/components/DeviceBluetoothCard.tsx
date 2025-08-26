import { useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { CompactCardWithIconLayout } from '@suite-native/atoms';
import { useBluetoothDevice, useBluetoothSettings } from '@suite-native/bluetooth';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings
>;

export const DeviceBluetoothCard = () => {
    const { showAlert } = useAlert();
    const { showToast } = useToast();
    const navigation = useNavigation<NavigationProp>();

    const { unpairBluetoothDevice } = useBluetoothDevice();
    const { openBluetoothSettings } = useBluetoothSettings();

    const unpairTrezor = async () => {
        navigation.navigate(DeviceSettingsStackRoutes.ContinueOnTrezor);
        await unpairBluetoothDevice({
            onSuccess: () => {
                showToast({
                    icon: 'check',
                    variant: 'success',
                    message: <Translation id="moduleDeviceSettings.bluetooth.successMessage" />,
                });
                openBluetoothSettings();
            },
            onCancel: () => navigation.goBack(),
        });
    };

    const showInfoAlert = () => {
        showAlert({
            title: <Translation id="moduleDeviceSettings.bluetooth.info.title" />,
            description: <Translation id="moduleDeviceSettings.bluetooth.info.description" />,
            primaryButtonTitle: (
                <Translation id="moduleDeviceSettings.bluetooth.unpairTrezorButton" />
            ),
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
            onPressPrimaryButton: unpairTrezor,
        });
    };

    return (
        <CompactCardWithIconLayout
            title={<Translation id="moduleDeviceSettings.bluetooth.title" />}
            subtitle={<Translation id="moduleDeviceSettings.bluetooth.content" />}
            icon="bluetoothSlash"
            onPress={showInfoAlert}
        />
    );
};
