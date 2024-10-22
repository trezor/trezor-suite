import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';

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
import { EventType, analytics } from '@suite-native/analytics';

type NavigationProp = StackToTabCompositeProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const PassphraseScreenHeader = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute();

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
        analytics.report({
            type: EventType.PassphraseExit,
            payload: { screen: route.name },
        });

        dispatch(cancelPassphraseAndSelectStandardDeviceThunk());
    }, [dispatch, navigation, route.name]);

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
                secondaryButtonVariant: 'redElevation0',
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
                iconName="x"
                size="medium"
                colorScheme="tertiaryElevation1"
                accessibilityRole="button"
                accessibilityLabel="close"
                onPress={handleCancel}
            />
        </ScreenHeaderWrapper>
    );
};
