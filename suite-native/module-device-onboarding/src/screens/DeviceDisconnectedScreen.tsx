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
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackToStackCompositeScreenProps,
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
            onPressPrimaryButton: () => setIsAlertDismissed(true),
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
            header={<ScreenHeader closeAction={navigateToHome} closeActionType="close" />}
            noHorizontalPadding
            noBottomPadding
            hasBottomInset={false}
            isScrollable={false}
        >
            {wasDeviceConnectedViaBluetooth ? (
                <TurnOnAndUnlockDeviceScreenContent isScanningInProgress={isAlertDismissed} />
            ) : (
                <ConnectAndUnlockDeviceScreenContent />
            )}
        </Screen>
    );
};
