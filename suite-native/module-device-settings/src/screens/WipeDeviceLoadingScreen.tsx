import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceInBootloader } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    HomeStackRoutes,
    LoadingSuccessScreen,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    RootStackParamList
>;

export const WipeDeviceLoadingScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const isDeviceInBootloader = useSelector(selectIsDeviceInBootloader);

    const handleFinish = () => {
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
    };

    return (
        <LoadingSuccessScreen
            onFinish={handleFinish}
            title={
                <Translation
                    id={`moduleDeviceSettings.wipeDevice.loadingSuccessScreen.${isDeviceInBootloader ? 'factoryResetTitle' : 'wipedTitle'}`}
                />
            }
        />
    );
};
