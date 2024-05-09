import { useSelector } from 'react-redux';
import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceDiscoveryActive,
} from '@suite-common/wallet-core';

import { PassphraseScreenHeader } from '../components/PassphraseScreenHeader';
import { DeviceT2B1Svg } from '../assets/DeviceT2B1Svg';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseConfirmOnTrezor,
    RootStackParamList
>;

export const PassphraseConfirmOnTrezorScreen = () => {
    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        if (isDeviceConnectedAndAuthorized && isDiscoveryActive) {
            navigation.navigate(PassphraseStackRoutes.PassphraseLoading);
        }
    }, [isDeviceConnectedAndAuthorized, isDiscoveryActive, navigation]);

    return (
        <Screen screenHeader={<PassphraseScreenHeader />}>
            <VStack
                spacing="large"
                alignItems="center"
                justifyContent="center"
                flex={1}
                padding="small"
            >
                <DeviceT2B1Svg />
                <CenteredTitleHeader
                    title={<Translation id="modulePassphrase.confirmOnDevice.title" />}
                    subtitle={<Translation id="modulePassphrase.confirmOnDevice.description" />}
                />
            </VStack>
        </Screen>
    );
};
