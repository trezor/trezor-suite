import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation, useRoute } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { EventType, analytics } from '@suite-native/analytics';
import { IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';
import {
    cancelPassphraseAndSelectStandardDeviceThunk,
    selectIsCreatingNewPassphraseWallet,
} from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToTabCompositeProps,
    useHandleHardwareBackNavigation,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

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

    const navigateToInitialScreen = useNavigateToInitialScreen();

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
            navigateToInitialScreen();
        }
    }, [handleClose, navigateToInitialScreen, isCreatingNewWalletInstance, showAlert]);

    useHandleHardwareBackNavigation(handleCancel);

    return (
        <ScreenHeaderWrapper>
            <IconButton
                iconName="x"
                size="medium"
                colorScheme="tertiaryElevation0"
                accessibilityRole="button"
                accessibilityLabel="close"
                onPress={handleCancel}
                testID="@passphrase/closeButton"
            />
        </ScreenHeaderWrapper>
    );
};
