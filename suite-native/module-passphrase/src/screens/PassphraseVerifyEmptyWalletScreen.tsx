import { useDispatch } from 'react-redux';
import { useCallback, useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { useAlert } from '@suite-native/alerts';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { AlertBox, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

import { PassphraseScreenHeader } from '../components/PassphraseScreenHeader';
import { PassphraseForm } from '../components/PassphraseForm';
import {
    retryPassphraseAuthenticationThunk,
    verifyPassphraseOnEmptyWalletThunk,
} from '../passphraseThunks';

type NavigationProp = StackToTabCompositeProps<
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList
>;

export const PassphraseVerifyEmptyWalletScreen = () => {
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProp>();

    const { showAlert } = useAlert();

    const { translate } = useTranslate();

    const handleVerify = useCallback(async () => {
        const response = await dispatch(verifyPassphraseOnEmptyWalletThunk());

        if (isFulfilled(response)) {
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        } else {
            showAlert({
                title: (
                    <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.passphraseMismatchAlert.title" />
                ),
                description: (
                    <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.passphraseMismatchAlert.description" />
                ),
                primaryButtonTitle: (
                    <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.passphraseMismatchAlert.buttonTitle" />
                ),
                onPressPrimaryButton: () => {
                    navigation.navigate(PassphraseStackRoutes.PassphraseForm);
                    dispatch(retryPassphraseAuthenticationThunk());
                },
                icon: 'warningTriangleLight',
                pictogramVariant: 'red',
            });
        }
    }, [dispatch, navigation, showAlert]);

    useEffect(() => {
        handleVerify();
    }, [handleVerify]);

    return (
        <Screen screenHeader={<PassphraseScreenHeader />}>
            <VStack spacing="large">
                <VStack spacing={12}>
                    <Text variant="titleMedium">
                        <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.title" />
                    </Text>
                    <Text>
                        <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.description" />
                    </Text>
                </VStack>
                <VStack spacing="medium">
                    <AlertBox
                        variant="warning"
                        title={
                            <Text>
                                <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.alertTitle" />
                            </Text>
                        }
                    />
                    <PassphraseForm
                        inputLabel={translate('modulePassphrase.form.verifyPassphraseInputLabel')}
                    />
                </VStack>
            </VStack>
        </Screen>
    );
};
