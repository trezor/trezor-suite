import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

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
import { CenteredTitleHeader, IconButton, ScreenHeaderWrapper, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { selectPassphraseError } from '@suite-native/passphrase';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';

import { DeviceT3T1Svg } from '../assets/DeviceT3T1Svg';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const PassphraseEnableOnDeviceScreen = () => {
    const passphraseError = useSelector(selectPassphraseError);

    const navigation = useNavigation<NavigationProp>();

    const { showToast } = useToast();
    const { translate } = useTranslate();

    useEffect(() => {
        if (passphraseError?.error === 'passphrase-enabling-cancelled') {
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
            showToast({
                variant: 'error',
                icon: 'warningTriangleLight',
                message: translate('modulePassphrase.enablePassphrase.cancelledError'),
            });
        }
    }, [navigation, passphraseError, showToast, translate]);

    const handleClose = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
        TrezorConnect.cancel();
    };

    return (
        <Screen
            screenHeader={
                <ScreenHeaderWrapper>
                    <IconButton
                        size="medium"
                        colorScheme="tertiaryElevation1"
                        accessibilityRole="button"
                        accessibilityLabel="close"
                        iconName="close"
                        onPress={handleClose}
                    />
                </ScreenHeaderWrapper>
            }
        >
            <VStack flex={1} justifyContent="center" alignItems="center" spacing="medium">
                <DeviceT3T1Svg />
                <CenteredTitleHeader
                    title={<Translation id="modulePassphrase.enablePassphrase.title" />}
                    subtitle={<Translation id="modulePassphrase.enablePassphrase.subtitle" />}
                />
            </VStack>
        </Screen>
    );
};
