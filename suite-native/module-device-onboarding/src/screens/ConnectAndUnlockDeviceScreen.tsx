import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/core';
import { useAtom, useSetAtom } from 'jotai';

import { useAlert } from '@suite-native/alerts';
import {
    ConnectAndUnlockDeviceScreenContent,
    isOnboardingDeviceDisconnectedAlertDisplayedAtom,
    wasDeviceDisconnectedByUserActionAtom,
} from '@suite-native/device';
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
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const navigation = useNavigation<NavigationProp>();
    const setIsOnboardingDeviceDisconnectedAlertDisplayed = useSetAtom(
        isOnboardingDeviceDisconnectedAlertDisplayedAtom,
    );

    const hideDeviceDisconnectedAlert = () =>
        setIsOnboardingDeviceDisconnectedAlertDisplayed(false);

    const [wasDeviceDisconnectedByUserAction, setWasDeviceDisconnectedByUserAction] = useAtom(
        wasDeviceDisconnectedByUserActionAtom,
    );

    const navigateToHome = () =>
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });

    useEffect(() => {
        // This alert should be shown only if the device was physically disconnected from the phone.
        // In case that user "disconnects" device by cancelling the onboarding flow via the app UI, the alert is not shown!
        if (!wasDeviceDisconnectedByUserAction) {
            setIsOnboardingDeviceDisconnectedAlertDisplayed(true);
            showAlert({
                title: translate('moduleDeviceOnboarding.deviceDisconnectedAlert.title'),
                description: translate(
                    'moduleDeviceOnboarding.deviceDisconnectedAlert.description',
                ),
                primaryButtonTitle: translate(
                    'moduleDeviceOnboarding.deviceDisconnectedAlert.reconnectButton',
                ),
                pictogramVariant: 'critical',
                primaryButtonVariant: 'redBold',
                secondaryButtonTitle: translate('generic.buttons.cancel'),
                secondaryButtonVariant: 'redElevation0',
                onPressPrimaryButton: hideDeviceDisconnectedAlert,
                onPressSecondaryButton: () => {
                    hideDeviceDisconnectedAlert();
                    navigateToHome();
                },
            });

            return;
        }
        setWasDeviceDisconnectedByUserAction(false);

        // This effect should be called only once during the first render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
