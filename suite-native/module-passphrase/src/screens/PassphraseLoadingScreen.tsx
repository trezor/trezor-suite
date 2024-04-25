import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { VStack, Spinner } from '@suite-native/atoms';
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
import { selectIsDeviceReadyToUseAndAuthorized } from '@suite-native/device';

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

    const isDeviceReadyToUseAndAuthorized = useSelector(selectIsDeviceReadyToUseAndAuthorized);

    const handleSuccess = () => {
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
    };

    const loadingResult = () => {
        if (!isDeviceAccountless) return 'success';
        if (isDeviceReadyToUseAndAuthorized) return 'success';

        return 'idle';
    };

    return (
        <Screen screenHeader={<PassphraseScreenHeader />}>
            <VStack flex={1} justifyContent="center" alignItems="center">
                <Spinner loadingState={loadingResult()} onComplete={handleSuccess} />
            </VStack>
        </Screen>
    );
};
