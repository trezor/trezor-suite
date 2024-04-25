import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import { VStack, Loader } from '@suite-native/atoms';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';

import { PassphraseScreenHeader } from '../components/PassphraseScreenHeader';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.PassphraseStack>;

export const PassphraseLoadingScreen = () => {
    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        // NOTE: This is just for demo purposes. Proper loading screen will be implemented in a follow-up.
        const timeout = setTimeout(() => {
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        }, 2000);

        return () => clearTimeout(timeout);
    }, [navigation]);

    return (
        <Screen screenHeader={<PassphraseScreenHeader />}>
            <VStack flex={1} justifyContent="center" alignItems="center">
                <Loader />
            </VStack>
        </Screen>
    );
};
