import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    AppTabsRoutes,
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { Box, Button, Card, CenteredTitleHeader, Text, VStack } from '@suite-native/atoms';
import { selectIsDeviceDiscoveryActive } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    selectIsCreatingNewPassphraseWallet,
    useAuthorizationGoBack,
} from '@suite-native/device-authorization';
import TrezorConnect from '@trezor/connect';

import { useAuthorizationSuccess } from '../../usePassphraseAuthorizationSuccess';
import { DeviceT3T1Svg } from '../../assets/passphrase/DeviceT3T1Svg';
import { PassphraseContentScreenWrapper } from '../../components/passphrase/PassphraseContentScreenWrapper';

const buttonWrapperStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

const cardStyle = prepareNativeStyle(_ => ({
    paddingTop: 28,
}));

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const PassphraseEnterOnTrezorScreen = () => {
    const dispatch = useDispatch();

    const { applyStyle } = useNativeStyles();

    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    const isCreatingNewWalletInstance = useSelector(selectIsCreatingNewPassphraseWallet);

    const navigation = useNavigation<NavigationProp>();

    const { handleGoBack } = useAuthorizationGoBack();

    // If this screen was present during authorizing device with passphrase for some feature,
    // on success, this hook will close the stack and go back
    useAuthorizationSuccess();

    useEffect(() => {
        if (isDiscoveryActive) {
            navigation.navigate(AuthorizeDeviceStackRoutes.PassphraseLoading);
        }
    }, [isDiscoveryActive, navigation]);

    const handleCancel = () => {
        if (isCreatingNewWalletInstance) {
            dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        } else {
            TrezorConnect.cancel();
            handleGoBack();
        }
    };

    return (
        <PassphraseContentScreenWrapper
            title={<Translation id="modulePassphrase.title" />}
            subtitle={
                <Translation
                    id="modulePassphrase.subtitle"
                    values={{
                        bold: chunks => <Text variant="highlight">{chunks}</Text>,
                    }}
                />
            }
        >
            <Card style={applyStyle(cardStyle)}>
                <VStack spacing={28}>
                    <VStack justifyContent="center" alignItems="center">
                        <DeviceT3T1Svg />
                        <CenteredTitleHeader
                            title={
                                <Translation id="modulePassphrase.enterPassphraseOnTrezor.title" />
                            }
                            subtitle={
                                <Translation id="modulePassphrase.enterPassphraseOnTrezor.subtitle" />
                            }
                        />
                    </VStack>
                    <Box style={applyStyle(buttonWrapperStyle)}>
                        <Button onPress={handleCancel} colorScheme="redElevation1">
                            <Translation id="generic.buttons.cancel" />
                        </Button>
                    </Box>
                </VStack>
            </Card>
        </PassphraseContentScreenWrapper>
    );
};
