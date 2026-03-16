import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { selectIsAnyNetworkEnabled } from '@suite-common/wallet-core';
import {
    AppTabsRoutes,
    AuthorizeDeviceStackRoutes,
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

    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const isAnyNetworkEnabled = useSelector(selectIsAnyNetworkEnabled);

    const onDeviceOnboardingFinishedNavigation = useCallback(() => {
        if (hasBitcoinOnlyFirmware || isAnyNetworkEnabled) {
            navigation.popTo(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        } else {
            navigation.popTo(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.CoinEnablingInit,
            });
        }
    }, [hasBitcoinOnlyFirmware, isAnyNetworkEnabled, navigation]);

    return { onDeviceOnboardingFinishedNavigation };
};
