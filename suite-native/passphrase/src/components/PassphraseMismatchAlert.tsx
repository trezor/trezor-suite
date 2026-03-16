import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import {
    cancelDiscoveryThunk,
    runDiscoveryThunk,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { events } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import {
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import { selectHasPassphraseMismatchError } from '../passphraseSelectors';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const PassphraseMismatchAlert = ({ children }: { children?: React.ReactNode }) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const navigation = useNavigation<NavigationProp>();
    const device = useSelector(selectSelectedDevice);
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const { showAlert } = useAlert();

    const hasPassphraseMismatchError = useSelector(selectHasPassphraseMismatchError);

    useEffect(() => {
        // Wrong passphrase was entered during verifying empty wallet
        if (hasPassphraseMismatchError) {
            analytics.report({ type: events.passphraseMismatchEvent.name });
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
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                secondaryButtonTitle: (
                    <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.passphraseMismatchAlert.secondaryButton" />
                ),
                onPressSecondaryButton: () => {
                    if (!device) return;
                    dispatch(cancelDiscoveryThunk(device));
                    navigateToInitialScreen();

                    analytics.report({
                        type: events.passphraseExitEvent.name,
                        payload: { screen: AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor },
                    });
                },
                secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
                pictogramVariant: 'critical',
            });
        }
    }, [
        device,
        dispatch,
        hasPassphraseMismatchError,
        analytics,
        navigateToInitialScreen,
        navigation,
        showAlert,
    ]);

    return children ?? null;
};
