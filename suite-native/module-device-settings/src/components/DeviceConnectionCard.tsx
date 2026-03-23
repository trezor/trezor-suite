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

export const DeviceConnectionCard = () => {
    const navigation = useNavigation<NavigationProp>();

    const navigateToDeviceConnection = () => {
        navigation.navigate(DeviceSettingsStackRoutes.DeviceConnection);
    };

    return (
        <CompactCardWithIconLayout
            icon="plugs"
            title={<Translation id="moduleDeviceSettings.connection.title" />}
            subtitle={<Translation id="moduleDeviceSettings.connection.description" />}
            onPress={navigateToDeviceConnection}
        />
    );
};
