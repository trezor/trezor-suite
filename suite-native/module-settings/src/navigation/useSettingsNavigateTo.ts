import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/core';

import type {
    RootStackParamList,
    SettingsStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { RootStackRoutes } from '@suite-native/navigation';

export const useSettingsNavigateTo = () => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    return useCallback(
        (routeName: SettingsStackRoutes): void => {
            navigation.navigate(RootStackRoutes.SettingsScreenStack, { screen: routeName });
        },
        [navigation],
    );
};
