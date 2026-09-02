import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation, useRoute } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { cancelDiscoveryThunk } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    type PassphraseStackParamList,
    type PassphraseStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToTabCompositeProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';

type NavigationProp = StackToTabCompositeProps<
    PassphraseStackParamList,
    PassphraseStackRoutes,
    RootStackParamList
>;

export const PassphraseScreenHeader = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute();
    const device = useSelector(selectSelectedDevice);
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const dispatch = useDispatch();

    const { showAlert } = useAlert();

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
        showAlert({
            title: <Translation id="modulePassphrase.confirmOnDevice.warningSheet.title" />,
            description: undefined,
            primaryButtonTitle: (
                <Translation id="modulePassphrase.confirmOnDevice.warningSheet.primaryButton" />
            ),
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            onPressPrimaryButton: handleClose,
            secondaryButtonTitle: (
                <Translation id="modulePassphrase.confirmOnDevice.warningSheet.secondaryButton" />
            ),
            secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
        });
    }, [handleClose, showAlert]);

    useInterceptNativeNavigation({ onPress: handleCancel });

    return (
        <ScreenHeaderWrapper>
            <IconButton
                iconName="x"
                intent="neutral"
                priority="secondary"
                size="medium"
                accessibilityRole="button"
                accessibilityLabel="close"
                onPress={handleCancel}
                testID="@passphrase/closeButton"
            />
        </ScreenHeaderWrapper>
    );
};
