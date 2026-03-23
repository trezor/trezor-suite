import { useNavigation } from '@react-navigation/native';

import { Translation } from '@suite-native/intl';
import {
    type DeviceAuthenticityStackParamList,
    type DeviceAuthenticityStackRoutes,
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { DeviceSettingsItemCard } from './DeviceSettingsItemCard';

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList
>;

export const DeviceAuthenticityCard = () => {
    const navigation = useNavigation<NavigationProp>();

    const handleOnPress = () => {
        navigation.navigate(DeviceSettingsStackRoutes.DeviceAuthenticity);
    };

    return (
        <DeviceSettingsItemCard
            icon="shield"
            onPress={handleOnPress}
            title={<Translation id="moduleDeviceSettings.authenticity.title" />}
            subtitle={<Translation id="moduleDeviceSettings.authenticity.content" />}
            testID="@device-authenticity/redirectToDeviceAuthenticityScreen"
        />
    );
};
