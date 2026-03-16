import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type AuthorizeDeviceStackParamList,
    type AuthorizeDeviceStackRoutes,
    type CloseActionType,
    type NavigateParameters,
    type RootStackParamList,
    type StackToStackCompositeNavigationProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';
import { selectIsCreatingNewPassphraseWallet } from '@suite-native/passphrase';
import TrezorConnect from '@trezor/connect';

import { selectDeviceRequestedPin } from '../deviceAuthorizationSlice';

type ConnectDeviceScreenHeaderProps = {
    shouldDisplayCancelButton?: boolean;
    onCancelNavigationTarget?: NavigateParameters<RootStackParamList>;
    closeActionType?: CloseActionType;
    onCancel?: () => void;
};

type NavigationProps = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
    RootStackParamList
>;

export const ConnectDeviceScreenHeader = ({
    shouldDisplayCancelButton = true,
    onCancelNavigationTarget,
    closeActionType = 'close',
    onCancel,
}: ConnectDeviceScreenHeaderProps) => {
    const navigation = useNavigation<NavigationProps>();
    const { showAlert, hideAlert } = useAlert();

    const hasDiscovery = useSelector(selectHasRunningDiscovery);
    const isAddingHiddenWallet = useSelector(selectIsCreatingNewPassphraseWallet);
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    const handleCancel = useCallback(() => {
        if (hasDiscovery && !isAddingHiddenWallet) {
            if (hasDeviceRequestedPin) {
                // Do not allow to cancel PIN entry while discovery is in progress
                showAlert({
                    type: 'connectDevice',
                    title: (
                        <Translation id="moduleConnectDevice.pinCanceledDuringDiscovery.title" />
                    ),
                    description: (
                        <Translation id="moduleConnectDevice.pinCanceledDuringDiscovery.subtitle" />
                    ),
                    pictogramVariant: 'critical',
                    primaryButtonTitle: (
                        <Translation id="moduleConnectDevice.pinCanceledDuringDiscovery.button" />
                    ),
                    onPressPrimaryButton: hideAlert,
                });
            }
        } else {
            if (hasDeviceRequestedPin || isAddingHiddenWallet) {
                TrezorConnect.cancel('pin-cancelled');
            }

            if (onCancel) {
                onCancel();
            } else if (onCancelNavigationTarget) {
                // Temporary solution, the onCancelNavigationTarget should be removed completely as a follow up.
                navigation.navigateDeprecated({ ...onCancelNavigationTarget });
            } else if (navigation.canGoBack()) {
                navigation.goBack();
            }
        }
    }, [
        hasDiscovery,
        isAddingHiddenWallet,
        hasDeviceRequestedPin,
        showAlert,
        hideAlert,
        onCancel,
        onCancelNavigationTarget,
        navigation,
    ]);

    useInterceptNativeNavigation({ onPress: handleCancel });

    // Hide alert when navigating away from the PIN entry screen (PIN entered or canceled on device)
    // eslint-disable-next-line arrow-body-style
    useEffect(() => {
        return () => {
            hideAlert('connectDevice');
        };
    }, [hideAlert]);

    return (
        <ScreenHeaderWrapper>
            {shouldDisplayCancelButton && (
                <IconButton
                    iconName={closeActionType === 'back' ? 'caretLeft' : 'x'}
                    size="medium"
                    colorScheme="tertiaryElevation0"
                    accessibilityRole="button"
                    accessibilityLabel="close"
                    onPress={handleCancel}
                    testID="@connect-device/header/close"
                />
            )}
        </ScreenHeaderWrapper>
    );
};
