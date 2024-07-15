import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import TrezorConnect from '@trezor/connect';
import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    selectIsCreatingNewPassphraseWallet,
    useAuthorizationGoBack,
} from '@suite-native/device-authorization';
import {
    RootStackRoutes,
    AppTabsRoutes,
    HomeStackRoutes,
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { useAlert } from '@suite-native/alerts';

type NavigationProp = StackToTabCompositeProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const PassphraseScreenHeader = () => {
    const navigation = useNavigation<NavigationProp>();

    const dispatch = useDispatch();

    const { showAlert } = useAlert();

    const isCreatingNewWalletInstance = useSelector(selectIsCreatingNewPassphraseWallet);

    const { handleGoBack } = useAuthorizationGoBack();

    const handleClose = useCallback(() => {
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
        dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
    }, [dispatch, navigation]);

    const handleCancel = useCallback(() => {
        if (isCreatingNewWalletInstance) {
            showAlert({
                title: <Translation id="modulePassphrase.confirmOnDevice.warningSheet.title" />,
                description: undefined,
                primaryButtonTitle: (
                    <Translation id="modulePassphrase.confirmOnDevice.warningSheet.primaryButton" />
                ),
                primaryButtonVariant: 'redBold',
                onPressPrimaryButton: handleClose,
                secondaryButtonTitle: (
                    <Translation id="modulePassphrase.confirmOnDevice.warningSheet.secondaryButton" />
                ),
            });
        } else {
            TrezorConnect.cancel();
            handleGoBack();
        }
    }, [handleClose, handleGoBack, isCreatingNewWalletInstance, showAlert]);

    useEffect(() => {
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            handleCancel();

            return true;
        });

        return () => subscription.remove();
    }, [handleCancel]);

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
        </ScreenHeaderWrapper>
    );
};
