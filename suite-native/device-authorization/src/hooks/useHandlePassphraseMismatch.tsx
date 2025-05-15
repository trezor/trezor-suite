import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    cancelDiscoveryThunk,
    deviceActions,
    runDiscoveryThunk,
    selectSelectedDevice,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { EventType, analytics } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
} from '@suite-native/navigation';
import { StackToStackCompositeNavigationProps } from '@suite-native/navigation/src/types';

import { selectHasPassphraseMismatchError } from '../deviceAuthorizationSlice';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor,
    RootStackParamList
>;

export const useHandlePassphraseMismatch = () => {
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProp>();
    const device = useSelector(selectSelectedDevice);

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
                    navigation.navigate(RootStackRoutes.AppTabs, {
                        screen: AppTabsRoutes.HomeStack,
                        params: {
                            screen: HomeStackRoutes.Home,
                        },
                    });

                    analytics.report({
                        type: EventType.PassphraseExit,
                        payload: { screen: AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor },
                    });
                },
                secondaryButtonVariant: 'redElevation0',
                pictogramVariant: 'critical',
            });
        }
    }, [device, dispatch, hasPassphraseMismatchError, navigation, showAlert]);
};
