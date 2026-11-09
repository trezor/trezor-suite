import { useNavigation } from '@react-navigation/native';

import { Translation } from '@suite-native/intl';
import {
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    LoadingSuccessScreen,
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    RootStackParamList
>;

export const DeviceNameLoadingScreen = () => {
    const navigation = useNavigation<NavigationProps>();

    const handleFinish = () => {
        navigation.popTo(DeviceSettingsStackRoutes.DeviceSettings);
    };

    return (
        <LoadingSuccessScreen
            onFinish={handleFinish}
            title={
                <Translation id="moduleDeviceSettings.changeDeviceName.loadingSuccessScreen.title" />
            }
        />
    );
};
