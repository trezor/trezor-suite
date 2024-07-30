import { BackHandler } from 'react-native';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import TrezorConnect from '@trezor/connect';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { Box, IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import { selectIsDeviceDiscoveryActive } from '@suite-common/wallet-core';
import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    selectIsCreatingNewPassphraseWallet,
    selectDeviceRequestedPin,
} from '@suite-native/device-authorization';

import { ConnectingTrezorHelp } from './ConnectingTrezorHelp';

type ConnectDeviceScreenHeaderProps = {
    shouldDisplayCancelButton?: boolean;
};

type NavigationProp = StackToTabCompositeProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.ConnectingDevice,
    RootStackParamList
>;

export const ConnectDeviceScreenHeader = ({
    shouldDisplayCancelButton = true,
}: ConnectDeviceScreenHeaderProps) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const { showAlert, hideAlert } = useAlert();

    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);
    const isCreatingNewWalletInstance = useSelector(selectIsCreatingNewPassphraseWallet);
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    const handleCancel = useCallback(() => {
        if (isDiscoveryActive) {
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
            if (navigation.canGoBack()) {
                navigation.goBack();
            }
        }
    }, [
        dispatch,
        hideAlert,
        isDiscoveryActive,
        navigation,
        showAlert,
        isCreatingNewWalletInstance,
        hasDeviceRequestedPin,
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
            <Box>
                {shouldDisplayCancelButton && (
                    <IconButton
                        iconName="close"
                        size="medium"
                        colorScheme="tertiaryElevation1"
                        accessibilityRole="button"
                        accessibilityLabel="close"
                        onPress={handleCancel}
                    />
                )}
            </Box>
            <ConnectingTrezorHelp />
        </ScreenHeaderWrapper>
    );
};
