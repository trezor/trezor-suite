import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectHasDeviceDiscovery } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';
import {
    selectDeviceRequestedPin,
    selectIsCreatingNewPassphraseWallet,
} from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    NavigateParameters,
    RootStackParamList,
    StackToTabCompositeProps,
    useHandleHardwareBackNavigation,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

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
    const navigation = useNavigation<NavigationProp>();
    const { showAlert, hideAlert } = useAlert();

    const hasDiscovery = useSelector(selectHasDeviceDiscovery);
    const isAddingHiddenWallet = useSelector(selectIsCreatingNewPassphraseWallet);
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);

    const handleCancel = useCallback(() => {
        if (hasDiscovery && !isAddingHiddenWallet) {
            if (hasDeviceRequestedPin) {
                // Do not allow to cancel PIN entry while discovery is in progress
                showAlert({
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

            if (onCancelNavigationTarget) {
                navigation.navigate(onCancelNavigationTarget);

                return;
            }

            if (navigation.canGoBack()) {
                navigation.goBack();
            }
        }
    }, [
        hasDiscovery,
        isAddingHiddenWallet,
        hasDeviceRequestedPin,
        showAlert,
        hideAlert,
        onCancelNavigationTarget,
        navigation,
    ]);

    useHandleHardwareBackNavigation(handleCancel);

    // Hide alert when navigating away from the PIN entry screen (PIN entered or canceled on device)
    // eslint-disable-next-line arrow-body-style
    useEffect(() => {
        return () => {
            hideAlert();
        };
    }, [hideAlert]);

    return (
        <ScreenHeaderWrapper>
            {shouldDisplayCancelButton && (
                <IconButton
                    iconName="x"
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
