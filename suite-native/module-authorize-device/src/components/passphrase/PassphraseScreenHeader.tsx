import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    BottomSheet,
    Text,
    Button,
    IconButton,
    ScreenHeaderWrapper,
    VStack,
} from '@suite-native/atoms';
import {
    AppTabsRoutes,
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';
import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    selectIsCreatingNewPassphraseWallet,
} from '@suite-native/passphrase';
import TrezorConnect from '@trezor/connect';

type NavigationProp = StackToTabCompositeProps<
    ConnectDeviceStackParamList,
    ConnectDeviceStackRoutes,
    RootStackParamList
>;

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
    gap: 12,
}));

export const PassphraseScreenHeader = () => {
    const { applyStyle } = useNativeStyles();

    const navigation = useNavigation<NavigationProp>();

    const dispatch = useDispatch();

    const [shouldShowWarningBottomSheet, setShouldShowWarningBottomSheet] = useState(false);

    const isCreatingNewWalletInstance = useSelector(selectIsCreatingNewPassphraseWallet);

    const handleClose = () => {
        dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
    };

    const toggleBottomSheet = () => {
        if (isCreatingNewWalletInstance) {
            setShouldShowWarningBottomSheet(!shouldShowWarningBottomSheet);
        } else {
            TrezorConnect.cancel();
            if (navigation.canGoBack()) {
                navigation.goBack();
            }
        }
    };

    return (
        <ScreenHeaderWrapper>
            <IconButton
                iconName="close"
                size="medium"
                colorScheme="tertiaryElevation1"
                accessibilityRole="button"
                accessibilityLabel="close"
                onPress={toggleBottomSheet}
            />
            <BottomSheet isVisible={shouldShowWarningBottomSheet} onClose={toggleBottomSheet}>
                <VStack justifyContent="center" alignItems="center" padding="small" spacing="large">
                    <Text variant="titleSmall" textAlign="center">
                        <Translation id="modulePassphrase.confirmOnDevice.warningSheet.title" />
                    </Text>
                    <VStack style={applyStyle(buttonWrapperStyle)}>
                        <Button colorScheme="redBold" onPress={handleClose}>
                            <Translation id="modulePassphrase.confirmOnDevice.warningSheet.primaryButton" />
                        </Button>
                        <Button colorScheme="redElevation0" onPress={toggleBottomSheet}>
                            <Translation id="modulePassphrase.confirmOnDevice.warningSheet.secondaryButton" />
                        </Button>
                    </VStack>
                </VStack>
            </BottomSheet>
        </ScreenHeaderWrapper>
    );
};
