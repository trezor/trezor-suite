import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes
>;

export const useOnDeviceOnboardingFinishedNavigation = () => {
    const navigation = useNavigation<NavigationProps>();

    const onDeviceOnboardingFinishedNavigation = useCallback(() => {
        navigation.navigate(DeviceOnboardingStackRoutes.Congratulations);
    }, [navigation]);

    return { onDeviceOnboardingFinishedNavigation };
};
