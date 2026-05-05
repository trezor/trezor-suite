import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    AppTabsRoutes,
    type DeviceOnboardingStackParamList,
    type DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList
>;

export const useOnDeviceOnboardingFinishedNavigation = () => {
    const navigation = useNavigation<NavigationProps>();

    const onDeviceOnboardingFinishedNavigation = useCallback(() => {
        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
    }, [navigation]);

    return { onDeviceOnboardingFinishedNavigation };
};
