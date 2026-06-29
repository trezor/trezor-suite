import { useNavigation } from '@react-navigation/native';

import {
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { DeviceSettingsItemCard } from './DeviceSettingsItemCard';

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.HealthCheck
>;

export const HealthCheckCard = () => {
    const navigation = useNavigation<NavigationProp>();

    const handleOnPress = () => {
        navigation.navigate(DeviceSettingsStackRoutes.HealthCheck);
    };

    return (
        <DeviceSettingsItemCard
            icon="shieldCheck"
            onPress={handleOnPress}
            title="Health Check"
            subtitle="NFC POC"
            testID="@device-settings/health-check"
        />
    );
};
