import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

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
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';
import TrezorConnect from '@trezor/connect';
import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    selectIsCreatingNewPassphraseWallet,
    useAuthorizationGoBack,
} from '@suite-native/device-authorization';

type NavigationProp = StackToTabCompositeProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
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

    const { handleGoBack } = useAuthorizationGoBack();

    const handleCancel = useCallback(() => {
        if (isCreatingNewWalletInstance) {
            setShouldShowWarningBottomSheet(!shouldShowWarningBottomSheet);
        } else {
            TrezorConnect.cancel();
            handleGoBack();
        }
    }, [handleGoBack, isCreatingNewWalletInstance, shouldShowWarningBottomSheet]);

    useEffect(() => {
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            handleCancel();

            return true;
        });

        return () => subscription.remove();
    }, [handleCancel]);

    const handleClose = () => {
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
        dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
    };

    return (
        <ScreenHeaderWrapper>
            <IconButton
                iconName="close"
                size="medium"
                colorScheme="tertiaryElevation1"
                accessibilityRole="button"
                accessibilityLabel="close"
                onPress={handleCancel}
            />
            <BottomSheet
                isVisible={shouldShowWarningBottomSheet}
                onClose={handleCancel}
                isCloseDisplayed={false}
            >
                <VStack justifyContent="center" alignItems="center" padding="small" spacing="large">
                    <Text variant="titleSmall" textAlign="center">
                        <Translation id="modulePassphrase.confirmOnDevice.warningSheet.title" />
                    </Text>
                    <VStack style={applyStyle(buttonWrapperStyle)}>
                        <Button colorScheme="redBold" onPress={handleClose}>
                            <Translation id="modulePassphrase.confirmOnDevice.warningSheet.primaryButton" />
                        </Button>
                        <Button colorScheme="redElevation0" onPress={handleCancel}>
                            <Translation id="modulePassphrase.confirmOnDevice.warningSheet.secondaryButton" />
                        </Button>
                    </VStack>
                </VStack>
            </BottomSheet>
        </ScreenHeaderWrapper>
    );
};
