import { BackHandler } from 'react-native';
import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import TrezorConnect from '@trezor/connect';
import {
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    RootStackParamList,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { Box, IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import { selectIsDeviceDiscoveryActive } from '@suite-common/wallet-core';

import { ConnectingTrezorHelp } from './ConnectingTrezorHelp';

type ConnectDeviceScreenHeaderProps = {
    shouldDisplayCancelButton?: boolean;
};

type NavigationProp = StackToTabCompositeProps<
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes.ConnectingDevice,
    RootStackParamList
>;

export const ConnectDeviceScreenHeader = ({
    shouldDisplayCancelButton = true,
}: ConnectDeviceScreenHeaderProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { showAlert, hideAlert } = useAlert();

    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);

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
            TrezorConnect.cancel('pin-cancelled');
            if (navigation.canGoBack()) {
                navigation.goBack();
            }
        }
    }, [hideAlert, isDiscoveryActive, navigation, showAlert]);

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
