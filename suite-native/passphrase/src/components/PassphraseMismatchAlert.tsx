import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    cancelDiscoveryThunk,
    runDiscoveryThunk,
    selectSelectedDevice,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { EventType } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useLegacyAnalytics } from '@suite-native/services';

import { selectHasPassphraseMismatchError } from '../passphraseSelectors';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const PassphraseMismatchAlert = ({ children }: { children?: React.ReactNode }) => {
    const dispatch = useDispatch();
    const legacyAnalytics = useLegacyAnalytics();
    const navigation = useNavigation<NavigationProp>();
    const device = useSelector(selectSelectedDevice);
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const { showAlert } = useAlert();

    const hasPassphraseMismatchError = useSelector(selectHasPassphraseMismatchError);

    useEffect(() => {
        // Wrong passphrase was entered during verifying empty wallet
        if (hasPassphraseMismatchError) {
            legacyAnalytics.report({ type: EventType.PassphraseMismatch });
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
                    if (!device) return;

                    dispatch(cancelDiscoveryThunk(device));
                    dispatch(
                        startDiscoveryThunk({
                            device,
                            isAddingHiddenWallet: true,
                            isAddingExistingWallet: false,
                        }),
                    );
                    dispatch(runDiscoveryThunk(device));
                    navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                        screen: AuthorizeDeviceStackRoutes.PassphraseForm,
                    });
                },
                primaryButtonVariant: 'redBold',
                secondaryButtonTitle: (
                    <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.passphraseMismatchAlert.secondaryButton" />
                ),
                onPressSecondaryButton: () => {
                    if (!device) return;
                    dispatch(cancelDiscoveryThunk(device));
                    navigateToInitialScreen();

                    legacyAnalytics.report({
                        type: EventType.PassphraseExit,
                        payload: { screen: AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor },
                    });
                },
                secondaryButtonVariant: 'redElevation0',
                pictogramVariant: 'critical',
            });
        }
    }, [
        device,
        dispatch,
        hasPassphraseMismatchError,
        legacyAnalytics,
        navigateToInitialScreen,
        navigation,
        showAlert,
    ]);

    return children ?? null;
};
