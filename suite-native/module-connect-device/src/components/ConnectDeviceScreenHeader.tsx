import { BackHandler } from 'react-native';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import TrezorConnect, { DeviceModelInternal } from '@trezor/connect';
import {
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    RootStackParamList,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { Box, IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import {
    selectDevice,
    selectDeviceModel,
    removeButtonRequests,
    selectIsDeviceDiscoveryActive,
    selectIsUnauthorizedPassphraseDevice,
} from '@suite-common/wallet-core';
import { cancelPassphraseAndSelectStandardDeviceThunk } from '@suite-native/passphrase';

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
    const dispatch = useDispatch();
    const { showAlert, hideAlert } = useAlert();

    const device = useSelector(selectDevice);
    const isUnauthorizedPassphraseDevice = useSelector(selectIsUnauthorizedPassphraseDevice);
    const deviceModel = useSelector(selectDeviceModel);
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

            dispatch(
                removeButtonRequests({
                    device,
                    buttonRequestCode:
                        deviceModel === DeviceModelInternal.T1B1
                            ? 'PinMatrixRequestType_Current'
                            : 'ButtonRequest_PinEntry',
                }),
            );

            // If pin screen was triggered from opening passphrase wallet (which creates new instance) and is cancelled, we need to select standard wallet
            if (isUnauthorizedPassphraseDevice) {
                dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
            }

            if (navigation.canGoBack()) {
                navigation.goBack();
            }
        }
    }, [
        device,
        deviceModel,
        dispatch,
        hideAlert,
        isDiscoveryActive,
        isUnauthorizedPassphraseDevice,
        navigation,
        showAlert,
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
