import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import { VStack, Text, Spinner, SpinnerLoadingState } from '@suite-native/atoms';
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
import { Translation } from '@suite-native/intl';

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
            <VStack flex={1} justifyContent="center" alignItems="center" spacing="extraLarge">
                <Spinner loadingState={loadingResult} onComplete={handleSuccess} />
                <VStack spacing="extraSmall">
                    <Text variant="titleSmall" textAlign="center">
                        <Translation id="modulePassphrase.loading.title" />
                    </Text>
                    <Text variant="body" textAlign="center" color="textSubdued">
                        <Translation id="modulePassphrase.loading.subtitle" />
                    </Text>
                </VStack>
            </VStack>
        </PassphraseScreenWrapper>
    );
};
