import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    type RootStackParamList,
    RootStackRoutes,
    type SettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

export const useSettingsNavigateTo = () => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    return useCallback(
        (routeName: SettingsStackRoutes): void => {
            navigation.navigate(RootStackRoutes.SettingsScreenStack, { screen: routeName });
        },
        [navigation],
    );
};
