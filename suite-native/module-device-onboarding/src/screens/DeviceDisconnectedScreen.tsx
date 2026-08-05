import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useAlert } from '@suite-native/alerts';
import {
    ConnectAndUnlockDeviceScreenContent,
    TurnOnAndUnlockDeviceScreenContent,
} from '@suite-native/device';
import { setWasDeviceOnboardingCancelled } from '@suite-native/device-onboarding';
import { useTranslate } from '@suite-native/intl';
import {
    AppTabsRoutes,
    type DeviceOnboardingStackParamList,
    type DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackToStackCompositeScreenProps,
    useInterceptNativeNavigation,
} from '@suite-native/navigation';

export const DeviceDisconnectedScreen = ({
    route,
    navigation,
}: StackToStackCompositeScreenProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.DeviceDisconnected,
    RootStackParamList
>) => {
    const { wasDeviceConnectedViaBluetooth } = route.params;

    const dispatch = useDispatch();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    const [isAlertDismissed, setIsAlertDismissed] = useState(false);
    useInterceptNativeNavigation();

    const navigateToHome = () =>
        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });

    // Leaving this screen (via the alert's Cancel or the header close) means the user gave up on this
    // onboarding; flag it so the connection middleware keeps them on Home instead of pulling them back
    // into onboarding on the next connect. Both exit paths must use this handler.
    const cancelOnboardingAndGoHome = () => {
        dispatch(setWasDeviceOnboardingCancelled(true));
        navigateToHome();
    };

    useEffect(() => {
        dispatch(setWasDeviceOnboardingCancelled(false));

        showAlert({
            title: translate('moduleDeviceOnboarding.deviceDisconnectedAlert.title'),
            description: translate('moduleDeviceOnboarding.deviceDisconnectedAlert.description'),
            primaryButtonTitle: translate(
                'moduleDeviceOnboarding.deviceDisconnectedAlert.reconnectButton',
            ),
            pictogramVariant: 'critical',
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            onPressPrimaryButton: () => setIsAlertDismissed(true),
            secondaryButtonTitle: translate('generic.buttons.cancel'),
            secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
            onPressSecondaryButton: cancelOnboardingAndGoHome,
        });

        // This effect should be called only once during the first render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Screen
            header={
                <ScreenHeader closeAction={cancelOnboardingAndGoHome} closeActionType="close" />
            }
            isScrollable={false}
        >
            {wasDeviceConnectedViaBluetooth ? (
                <TurnOnAndUnlockDeviceScreenContent isStatusVisible={isAlertDismissed} />
            ) : (
                <ConnectAndUnlockDeviceScreenContent />
            )}
        </Screen>
    );
};
