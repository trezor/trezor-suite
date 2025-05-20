import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    cancelDiscoveryThunk,
    deviceActions,
    runDiscoveryThunk,
    selectSelectedDevice,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { EventType, analytics } from '@suite-native/analytics';
import { selectHasPassphraseMismatchError } from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import { AuthorizeDeviceStackRoutes, useNavigateToInitialScreen } from '@suite-native/navigation';

export const PassphraseMismatchAlert = ({ children }: { children?: React.ReactNode }) => {
    const dispatch = useDispatch();

    const device = useSelector(selectSelectedDevice);
    const navigateToInitialScreen = useNavigateToInitialScreen();

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
                    if (!device) return;

                    dispatch(cancelDiscoveryThunk(device));
                    dispatch(
                        deviceActions.removeButtonRequests({
                            device,
                            buttonRequestCode: 'ButtonRequest_Other',
                        }),
                    );
                    dispatch(
                        startDiscoveryThunk({
                            device,
                            isAddingHiddenWallet: true,
                            isAddingExistingWallet: false,
                        }),
                    );
                    dispatch(runDiscoveryThunk(device));
                },
                primaryButtonVariant: 'redBold',
                secondaryButtonTitle: (
                    <Translation id="modulePassphrase.emptyPassphraseWallet.verifyEmptyWallet.passphraseMismatchAlert.secondaryButton" />
                ),
                onPressSecondaryButton: () => {
                    if (!device) return;
                    dispatch(cancelDiscoveryThunk(device));
                    navigateToInitialScreen();

                    analytics.report({
                        type: EventType.PassphraseExit,
                        payload: { screen: AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor },
                    });
                },
                secondaryButtonVariant: 'redElevation0',
                pictogramVariant: 'critical',
            });
        }
    }, [device, dispatch, hasPassphraseMismatchError, navigateToInitialScreen, showAlert]);

    return children ?? null;
};
