import { useNavigation } from '@react-navigation/native';

import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    StackNavigationProps,
    WipeDeviceStackRoutes,
} from '@suite-native/navigation';

import { SettingsItemCard } from './SettingsItemCard';

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
        <SettingsItemCard
            title={<Translation id="moduleDeviceSettings.wipeDevice.title" />}
            icon="arrowsClockwise"
            subtitle="This will reset all stored data"
            onPress={handleRedirect}
            variant="danger"
        />
    );
};
