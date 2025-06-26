import { useNavigation } from '@react-navigation/native';

import { CompactCardWithIconLayout } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
    WipeDeviceStackRoutes,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceSettings
>;

export const WipeDeviceCard = () => {
    const navigation = useNavigation<NavigationProp>();

    const handleRedirect = () => {
        navigation.navigate(DeviceSettingsStackRoutes.WipeDeviceStack, {
            screen: WipeDeviceStackRoutes.WipeDevice,
        });
    };

    return (
        <CompactCardWithIconLayout
            title={<Translation id="moduleDeviceSettings.wipeDevice.title" />}
            icon="warningOctagon"
            subtitle={<Translation id="moduleDeviceSettings.wipeDevice.subtitle" />}
            onPress={handleRedirect}
            variant="danger"
        />
    );
};
