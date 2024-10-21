import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import { EventType, analytics } from '@suite-native/analytics';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import { StackToStackCompositeNavigationProps } from '@suite-native/navigation/src/types';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
} from '@suite-native/navigation';

import { selectHasPassphraseMismatchError } from '../deviceAuthorizationSlice';
import {
    retryPassphraseAuthenticationThunk,
    cancelPassphraseAndSelectStandardDeviceThunk,
} from '../passphraseThunks';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor,
    RootStackParamList
>;

export const useHandlePassphraseMismatch = () => {
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProp>();

    const { showAlert } = useAlert();

    const hasPassphraseMismatchError = useSelector(selectHasPassphraseMismatchError);

    useEffect(() => {
        // Wrong passphrase was entered during verifying empty wallet
        if (hasPassphraseMismatchError) {
            analytics.report({ type: EventType.PassphraseMismatch });
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
                    navigation.navigate(AuthorizeDeviceStackRoutes.PassphraseForm);
                    dispatch(retryPassphraseAuthenticationThunk());
                },
                primaryButtonVariant: 'redBold',
                secondaryButtonTitle: (
                    <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.passphraseMismatchAlert.secondaryButton" />
                ),
                onPressSecondaryButton: () => {
                    dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
                    analytics.report({
                        type: EventType.PassphraseExit,
                        payload: { screen: AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor },
                    });
                },
                secondaryButtonVariant: 'redElevation0',
                icon: 'warning',
                pictogramVariant: 'red',
            });
        }
    }, [dispatch, hasPassphraseMismatchError, navigation, showAlert]);
};
