import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/core';

import { useAlert } from '@suite-native/alerts';
import { ConnectAndUnlockDeviceScreenContent } from '@suite-native/device';
import { setWasDeviceOnboardingCancelled } from '@suite-native/device-onboarding';
import { useTranslate } from '@suite-native/intl';
import {
    AppTabsRoutes,
    DeviceOnboardingStackParamList,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    RootStackRoutes.DeviceOnboardingStack,
    RootStackParamList
>;

export const ConnectAndUnlockDeviceScreen = () => {
    const dispatch = useDispatch();

    const { showAlert } = useAlert();

    const { translate } = useTranslate();

    const navigation = useNavigation<NavigationProp>();

    const navigateToHome = () =>
        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });

    useEffect(() => {
        dispatch(setWasDeviceOnboardingCancelled(false));

        showAlert({
            title: translate('moduleDeviceOnboarding.deviceDisconnectedAlert.title'),
            description: translate('moduleDeviceOnboarding.deviceDisconnectedAlert.description'),
            primaryButtonTitle: translate(
                'moduleDeviceOnboarding.deviceDisconnectedAlert.reconnectButton',
            ),
            pictogramVariant: 'critical',
            primaryButtonVariant: 'redBold',
            secondaryButtonTitle: translate('generic.buttons.cancel'),
            secondaryButtonVariant: 'redElevation0',
            onPressSecondaryButton: () => {
                setWasDeviceOnboardingCancelled(true);
                navigateToHome();
            },
        });

        // This effect should be called only once during the first render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            if (e.data.action.type === 'GO_BACK') {
                // Prevent going back to device onboarding without device connected.
                e.preventDefault();
            }
        });

        return unsubscribe;
    }, [navigation]);

    return (
        <Screen
            noHorizontalPadding
            hasBottomInset={false}
            isScrollable={false}
            header={<ScreenHeader closeAction={navigateToHome} closeActionType="close" />}
        >
            <ConnectAndUnlockDeviceScreenContent />
        </Screen>
    );
};
