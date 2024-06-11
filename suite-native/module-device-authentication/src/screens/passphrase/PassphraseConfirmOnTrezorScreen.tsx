import { useSelector } from 'react-redux';
import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    DeviceAuthenticationStackParamList,
    DeviceAuthenticationStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    selectIsDeviceConnectedAndAuthorized,
    selectIsDeviceDiscoveryActive,
} from '@suite-common/wallet-core';
import { selectIsDeviceAuthenticationFlowActive } from '@suite-native/device-authentication';

import { DeviceT2B1Svg } from '../../assets/DeviceT2B1Svg';
import { PassphraseScreenWrapper } from '../../components/passphrase/PassphraseScreenWrapper';

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceAuthenticationStackParamList,
    DeviceAuthenticationStackRoutes,
    RootStackParamList
>;

export const PassphraseConfirmOnTrezorScreen = () => {
    const navigation = useNavigation<NavigationProp>();

    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);
    const isDeviceAuthenticationFlowActive = useSelector(selectIsDeviceAuthenticationFlowActive);

    useEffect(() => {
        if (!isDeviceAuthenticationFlowActive && navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [isDeviceAuthenticationFlowActive, navigation]);

    useEffect(() => {
        if (isDeviceConnectedAndAuthorized && isDiscoveryActive) {
            navigation.navigate(DeviceAuthenticationStackRoutes.PassphraseLoading);
        }
    }, [isDeviceConnectedAndAuthorized, isDiscoveryActive, navigation]);

    return (
        <PassphraseScreenWrapper>
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
        </PassphraseScreenWrapper>
    );
};
