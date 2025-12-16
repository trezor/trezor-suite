import { useNavigation } from '@react-navigation/native';

import { CompactCardWithIconLayout } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings
>;

export const DeviceAutoConnectCard = () => {
    const navigation = useNavigation<NavigationProp>();

    const onPress = () => {
        navigation.navigate(DeviceSettingsStackRoutes.DeviceAutoConnect);
    };

    return (
        <CompactCardWithIconLayout
            icon="trezorSafe5"
            title={<Translation id="moduleDeviceSettings.autoconnect.settingsCard.title" />}
            subtitle={
                <Translation id="moduleDeviceSettings.autoconnect.settingsCard.description" />
            }
            onPress={onPress}
        />
    );
};
