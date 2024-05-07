import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { VStack, Loader } from '@suite-native/atoms';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import {
    selectIsDeviceAccountless,
    selectIsDeviceDiscoveryActive,
} from '@suite-common/wallet-core';

import { PassphraseScreenHeader } from '../components/PassphraseScreenHeader';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList
>;

export const PassphraseLoadingScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const isDeviceAccountless = useSelector(selectIsDeviceAccountless);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    useEffect(() => {
        if (!isDeviceAccountless) {
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        } else if (isDeviceAccountless && !isDiscoveryActive) {
            navigation.navigate(RootStackRoutes.PassphraseStack, {
                screen: PassphraseStackRoutes.PassphraseEmptyWallet,
            });
        }
    }, [isDeviceAccountless, isDiscoveryActive, navigation]);

    return (
        <Screen screenHeader={<PassphraseScreenHeader />}>
            <VStack flex={1} justifyContent="center" alignItems="center">
                <Loader />
            </VStack>
        </Screen>
    );
};
