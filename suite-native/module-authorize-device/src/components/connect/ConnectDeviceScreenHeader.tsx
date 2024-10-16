import { BackHandler } from 'react-native';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import TrezorConnect from '@trezor/connect';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    NavigateParameters,
    RootStackParamList,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import { selectHasDeviceDiscovery } from '@suite-common/wallet-core';
import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    selectIsCreatingNewPassphraseWallet,
    selectDeviceRequestedPin,
} from '@suite-native/device-authorization';

import { ConnectingTrezorHelp } from './ConnectingTrezorHelp';

type ConnectDeviceScreenHeaderProps = {
    shouldDisplayCancelButton?: boolean;
    onCancelNavigationTarget?: NavigateParameters<RootStackParamList>;
};

type NavigationProp = StackToTabCompositeProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.ConnectingDevice,
    RootStackParamList
>;

export const ConnectDeviceScreenHeader = ({
    shouldDisplayCancelButton = true,
    onCancelNavigationTarget,
}: ConnectDeviceScreenHeaderProps) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const { showAlert, hideAlert } = useAlert();

    const hasDiscovery = useSelector(selectHasDeviceDiscovery);
    const isCreatingNewWalletInstance = useSelector(selectIsCreatingNewPassphraseWallet);
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    const handleCancel = useCallback(() => {
        if (hasDiscovery) {
            // Do not allow to cancel PIN entry while discovery is in progress
            showAlert({
                title: <Translation id="moduleConnectDevice.pinCanceledDuringDiscovery.title" />,
                description: (
                    <Translation id="moduleConnectDevice.pinCanceledDuringDiscovery.subtitle" />
                ),
                icon: 'warningCircleLight',
                pictogramVariant: 'red',
                primaryButtonTitle: (
                    <Translation id="moduleConnectDevice.pinCanceledDuringDiscovery.button" />
                ),
                onPressPrimaryButton: hideAlert,
            });
        } else {
            // Remove unauthorized passphrase device if it was created before prompting the PIN.
            if (isCreatingNewWalletInstance) {
                dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
            }

            if (hasDeviceRequestedPin) {
                TrezorConnect.cancel('pin-cancelled');
            }

            if (onCancelNavigationTarget) {
                navigation.navigate(onCancelNavigationTarget);

                return;
            }

            if (navigation.canGoBack()) {
                navigation.goBack();
            }
        }
    }, [
        dispatch,
        hideAlert,
        hasDiscovery,
        navigation,
        showAlert,
        isCreatingNewWalletInstance,
        hasDeviceRequestedPin,
        onCancelNavigationTarget,
    ]);

    // Handle hardware back button press same as cancel button
    useEffect(() => {
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            handleCancel();

            return true;
        });

        return () => subscription.remove();
    }, [handleCancel]);

    // Hide alert when navigating away from the PIN entry screen (PIN entered or canceled on device)
    useEffect(() => {
        return () => {
            hideAlert();
        };
    }, [hideAlert]);

    return (
        <ScreenHeaderWrapper>
            {shouldDisplayCancelButton && (
                <IconButton
                    iconName="close"
                    size="medium"
                    colorScheme="tertiaryElevation0"
                    accessibilityRole="button"
                    accessibilityLabel="close"
                    onPress={handleCancel}
                />
            )}
            <ConnectingTrezorHelp />
        </ScreenHeaderWrapper>
    );
};
