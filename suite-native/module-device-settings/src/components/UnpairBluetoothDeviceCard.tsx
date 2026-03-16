import { useNavigation } from '@react-navigation/native';

import { CompactCardWithIconLayout } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings
>;

export const UnpairBluetoothDeviceCard = () => {
    const navigation = useNavigation<NavigationProp>();

    const navigateToUnpairScreen = () => {
        navigation.navigate(DeviceSettingsStackRoutes.UnpairBluetoothDevice);
    };

    return (
        <CompactCardWithIconLayout
            title={<Translation id="moduleDeviceSettings.bluetooth.title" />}
            subtitle={<Translation id="moduleDeviceSettings.bluetooth.content" />}
            icon="bluetoothSlash"
            onPress={navigateToUnpairScreen}
        />
    );
};
