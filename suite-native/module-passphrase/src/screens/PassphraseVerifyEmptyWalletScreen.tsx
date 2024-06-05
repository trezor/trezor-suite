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
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { AlertBox, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    retryPassphraseAuthenticationThunk,
    verifyPassphraseOnEmptyWalletThunk,
} from '@suite-native/passphrase';

import { PassphraseFormScreenWrapper } from '../components/PassphraseFormScreenWrapper';

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
                    <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.passphraseMismatchAlert.primaryButton" />
                ),
                onPressPrimaryButton: () => {
                    navigation.navigate(PassphraseStackRoutes.PassphraseForm);
                    dispatch(retryPassphraseAuthenticationThunk());
                },
                primaryButtonVariant: 'redBold',
                secondaryButtonTitle: (
                    <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.passphraseMismatchAlert.secondaryButton" />
                ),
                onPressSecondaryButton: () => {
                    dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
                    navigation.navigate(RootStackRoutes.AppTabs, {
                        screen: AppTabsRoutes.HomeStack,
                        params: {
                            screen: HomeStackRoutes.Home,
                        },
                    });
                },
                secondaryButtonVariant: 'redElevation0',
                icon: 'warningTriangleLight',
                pictogramVariant: 'red',
            });
        }
    }, [dispatch, navigation, showAlert]);

    useEffect(() => {
        handleVerify();
    }, [handleVerify]);

    return (
        <PassphraseFormScreenWrapper
            title={
                <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.title" />
            }
            subtitle={
                <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.description" />
            }
            inputLabel={translate('modulePassphrase.form.verifyPassphraseInputLabel')}
        >
            <AlertBox
                variant="warning"
                title={
                    <Text>
                        <Translation
                            id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.alertTitle"
                            values={{
                                bold: chunks => <Text variant="highlight">{chunks}</Text>,
                            }}
                        />
                    </Text>
                }
            />
        </PassphraseFormScreenWrapper>
    );
};
