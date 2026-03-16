import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation, useRoute } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { cancelDiscoveryThunk } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { events } from '@suite-native/analytics';
import { IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    type AuthorizeDeviceStackParamList,
    type AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToTabCompositeProps,
    useInterceptNativeNavigation,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import TrezorConnect from '@trezor/connect';

import { selectIsCreatingNewPassphraseWallet } from '../passphraseSelectors';

type NavigationProp = StackToTabCompositeProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const PassphraseScreenHeader = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute();
    const device = useSelector(selectSelectedDevice);
    const analytics = useAnalytics();
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
            type: events.passphraseExitEvent.name,
            payload: { screen: route.name },
        });

        if (device) {
            dispatch(cancelDiscoveryThunk(device));
        }
    }, [navigation, analytics, route.name, device, dispatch]);

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

    useInterceptNativeNavigation({ onPress: handleCancel });

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
