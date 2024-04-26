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
import { selectIsDeviceConnectedAndAuthorized } from '@suite-common/wallet-core';

import { PassphraseScreenHeader } from '../components/PassphraseScreenHeader';
import { DeviceTS3Svg } from '../assets/DeviceTS3Svg';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseConfirmOnDevice,
    RootStackParamList
>;

export const PassphraseConfirmOnDeviceScreen = () => {
    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);

    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        if (isDeviceConnectedAndAuthorized) {
            navigation.navigate(PassphraseStackRoutes.PassphraseLoading);
        }
    }, [isDeviceConnectedAndAuthorized, navigation]);

    return (
        <Screen screenHeader={<PassphraseScreenHeader />}>
            <VStack
                spacing="large"
                alignItems="center"
                justifyContent="center"
                flex={1}
                padding="small"
            >
                <DeviceTS3Svg />
                <CenteredTitleHeader
                    title={<Translation id="modulePassphrase.confirmOnDevice.title" />}
                    subtitle={<Translation id="modulePassphrase.confirmOnDevice.description" />}
                />
            </VStack>
        </Screen>
    );
};
