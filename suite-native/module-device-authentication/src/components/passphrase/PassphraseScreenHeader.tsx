import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';

import {
    BottomSheet,
    Text,
    Button,
    IconButton,
    ScreenHeaderWrapper,
    VStack,
} from '@suite-native/atoms';
import {
    DeviceAuthenticationStackParamList,
    DeviceAuthenticationStackRoutes,
    RootStackParamList,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';
import TrezorConnect from '@trezor/connect';
import { deviceActions, selectDevice, selectDeviceState } from '@suite-common/wallet-core';

type NavigationProp = StackToTabCompositeProps<
    DeviceAuthenticationStackParamList,
    DeviceAuthenticationStackRoutes,
    RootStackParamList
>;

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
    gap: 12,
}));

export const PassphraseScreenHeader = () => {
    const route = useRoute();

    const device = useSelector(selectDevice);
    const deviceState = useSelector(selectDeviceState);

    const { applyStyle } = useNativeStyles();

    const navigation = useNavigation<NavigationProp>();

    const dispatch = useDispatch();

    const [shouldShowWarningBottomSheet, setShouldShowWarningBottomSheet] = useState(false);

    const handleClose = () => {
        // If cancel happens on screen where passphrase was requested by some feature (receive, add account, send, etc),
        // only cancel the TrezorConnect call and go back to previous screen. We want to keep the passphrase wallet.
        TrezorConnect.cancel();
        dispatch(deviceActions.removeButtonRequests({ device }));
        if (navigation.canGoBack()) navigation.goBack();
    };

    const handlePress = () => {
        if (
            route.name === DeviceAuthenticationStackRoutes.PassphraseConfirmOnTrezor &&
            !deviceState
        ) {
            setShouldShowWarningBottomSheet(true);
        } else {
            handleClose();
        }
    };

    const handleCloseBottomSheet = () => setShouldShowWarningBottomSheet(false);

    return (
        <ScreenHeaderWrapper>
            <IconButton
                iconName="close"
                size="medium"
                colorScheme="tertiaryElevation1"
                accessibilityRole="button"
                accessibilityLabel="close"
                onPress={handlePress}
            />
            <BottomSheet isVisible={shouldShowWarningBottomSheet} onClose={handleCloseBottomSheet}>
                <VStack justifyContent="center" alignItems="center" padding="small" spacing="large">
                    <Text variant="titleSmall" textAlign="center">
                        <Translation id="modulePassphrase.confirmOnDevice.warningSheet.title" />
                    </Text>
                    <VStack style={applyStyle(buttonWrapperStyle)}>
                        <Button colorScheme="redBold" onPress={handleClose}>
                            <Translation id="modulePassphrase.confirmOnDevice.warningSheet.primaryButton" />
                        </Button>
                        <Button colorScheme="redElevation0" onPress={handleCloseBottomSheet}>
                            <Translation id="modulePassphrase.confirmOnDevice.warningSheet.secondaryButton" />
                        </Button>
                    </VStack>
                </VStack>
            </BottomSheet>
        </ScreenHeaderWrapper>
    );
};
