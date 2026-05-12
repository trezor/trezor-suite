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
    type PassphraseStackParamList,
    PassphraseStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import { selectHasPassphraseMismatchError } from '../passphraseSelectors';

type NavigationProp = StackToStackCompositeNavigationProps<
    PassphraseStackParamList,
    PassphraseStackRoutes.PassphraseForm,
    RootStackParamList
>;

export const usePassphraseMismatchAlert = () => {
    const { showAlert } = useAlert();
    const analytics = useAnalytics();
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const hasPassphraseMismatchError = useSelector(selectHasPassphraseMismatchError);

    const onPassphraseMismatchAlert = () => {
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
                    dispatch(runDiscoveryThunk({ device }));
                    navigation.navigate(RootStackRoutes.PassphraseStack, {
                        screen: PassphraseStackRoutes.PassphraseForm,
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
                        payload: { screen: PassphraseStackRoutes.PassphraseConfirmOnTrezor },
                    });
                },
                secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
                pictogramVariant: 'critical',
            });
        }
    };

    return { onPassphraseMismatchAlert };
};
