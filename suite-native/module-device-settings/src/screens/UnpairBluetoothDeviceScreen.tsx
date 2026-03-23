import { useNavigation } from '@react-navigation/native';

import { Button, VStack } from '@suite-native/atoms';
import { useBluetoothDevice } from '@suite-native/bluetooth';
import { Translation } from '@suite-native/intl';
import {
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    DynamicScreenHeader,
    Screen,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings
>;

export const UnpairBluetoothDeviceScreen = () => {
    const { showToast } = useToast();
    const navigation = useNavigation<NavigationProp>();

    const { unpairBluetoothDevice } = useBluetoothDevice();

    const handleUnpairTrezor = async () => {
        navigation.navigate(DeviceSettingsStackRoutes.ContinueOnTrezor);
        await unpairBluetoothDevice({
            onSuccess: () => {
                showToast({
                    icon: 'check',
                    variant: 'success',
                    message: <Translation id="moduleDeviceSettings.bluetooth.successMessage" />,
                });
            },
            onCancel: navigation.goBack,
        });
    };

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleDeviceSettings.bluetooth.title" />}
                    subtitle={<Translation id="moduleDeviceSettings.bluetooth.description" />}
                    closeActionType="back"
                />
            }
        >
            <VStack justifyContent="flex-end" flex={1}>
                <Button onPress={handleUnpairTrezor}>
                    <Translation id="moduleDeviceSettings.bluetooth.unpairTrezorButton" />
                </Button>
            </VStack>
        </Screen>
    );
};
