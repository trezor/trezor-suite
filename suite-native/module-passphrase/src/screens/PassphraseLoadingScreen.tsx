import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import { VStack, Spinner, SpinnerLoadingState } from '@suite-native/atoms';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import {
    selectIsDeviceAccountless,
    selectIsDeviceDiscoveryActive,
} from '@suite-common/wallet-core';

import { PassphraseScreenWrapper } from '../components/PassphraseScreenWrapper';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList
>;

export const PassphraseLoadingScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const isDeviceAccountless = useSelector(selectIsDeviceAccountless);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);
    const [loadingResult, setLoadingResult] = useState<SpinnerLoadingState>('idle');

    useEffect(() => {
        if (!isDeviceAccountless || (isDeviceAccountless && !isDiscoveryActive)) {
            setLoadingResult('success');
        }
    }, [isDeviceAccountless, isDiscoveryActive]);

    const handleSuccess = () => {
        if (!isDeviceAccountless) {
            setLoadingResult('success');
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        } else if (isDeviceAccountless && !isDiscoveryActive) {
            setLoadingResult('success');
            navigation.navigate(RootStackRoutes.PassphraseStack, {
                screen: PassphraseStackRoutes.PassphraseEmptyWallet,
            });
        }
    };

    return (
        <PassphraseScreenWrapper>
            <VStack flex={1} justifyContent="center" alignItems="center">
                <Spinner loadingState={loadingResult} onComplete={handleSuccess} />
            </VStack>
        </PassphraseScreenWrapper>
    );
};
