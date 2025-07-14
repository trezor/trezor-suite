import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/core';
import { useSetAtom } from 'jotai';

import { useAlert } from '@suite-native/alerts';
import {
    ConnectAndUnlockDeviceScreenContent,
    startDeviceConnectionListening,
    wasDeviceOnboardingCancelledAtom,
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
import { setIsDeviceOnboardingDeviceDisconnectedAlertDisplayed } from '@suite-native/settings';

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    RootStackRoutes.DeviceOnboardingStack,
    RootStackParamList
>;

export const ConnectAndUnlockDeviceScreen = () => {
    const { showAlert } = useAlert();
    const dispatch = useDispatch();
    const { translate } = useTranslate();
    const navigation = useNavigation<NavigationProp>();

    const hideDeviceDisconnectedAlert = () =>
        dispatch(setIsDeviceOnboardingDeviceDisconnectedAlertDisplayed(false));

    const setWasDeviceOnboardingCancelled = useSetAtom(wasDeviceOnboardingCancelledAtom);

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
        dispatch(setIsDeviceOnboardingDeviceDisconnectedAlertDisplayed(true));
        startDeviceConnectionListening();
        setWasDeviceOnboardingCancelled(false);

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
            onPressPrimaryButton: hideDeviceDisconnectedAlert,
            onPressSecondaryButton: () => {
                setWasDeviceOnboardingCancelled(true);
                hideDeviceDisconnectedAlert();
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
