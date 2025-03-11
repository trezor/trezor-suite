import { useCallback, useState } from 'react';

import { CommonActions, useNavigation } from '@react-navigation/native';
import { useAtom } from 'jotai';

import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';
import {
    AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    OnboardingStackParamList,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useDebounce } from '@trezor/react-utils';

import { wasDeviceDisconnectedByUserActionAtom } from '../deviceAtoms';

type NavigationProp = StackToStackCompositeNavigationProps<
    OnboardingStackParamList,
    RootStackRoutes.OnboardingStack,
    RootStackParamList
>;

export const useHandleOnboardingDeviceDisconnection = () => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const debounce = useDebounce();
    const navigation = useNavigation<NavigationProp>();
    const [
        isOnboardingDeviceDisconnectedAlertDisplayed,
        setIsOnboardingDeviceDisconnectedAlertDisplayed,
    ] = useState(false);

    const hideDeviceDisconnectedAlert = useCallback(() => {
        setIsOnboardingDeviceDisconnectedAlertDisplayed(false);
    }, []);
    const [wasDeviceDisconnectedByUserAction, setWasDeviceDisconnectedByUserAction] = useAtom(
        wasDeviceDisconnectedByUserActionAtom,
    );

    const handleOnboardingDeviceDisconnection = useCallback(() => {
        // The disconnection event sometimes triggers multiple times for some reason, so we debounce it to handle it only once.
        debounce(() => {
            navigation.dispatch(
                CommonActions.reset({
                    index: 1,
                    routes: [
                        {
                            name: RootStackRoutes.AppTabs,
                            params: {
                                screen: HomeStackRoutes.Home,
                            },
                        },
                        {
                            name: RootStackRoutes.AuthorizeDeviceStack,
                            params: {
                                screen: AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
                            },
                        },
                    ],
                }),
            );

            // This alert should be shown only if the device was physically disconnected from the phone.
            // In case that user "disconnects" device by cancelling the onboarding flow via the app UI, the alert is not shown.
            if (!wasDeviceDisconnectedByUserAction) {
                setIsOnboardingDeviceDisconnectedAlertDisplayed(true);
                // We need to wait for the navigation to be completed before showing the alert.
                setTimeout(() => {
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
                        onPressSecondaryButton: hideDeviceDisconnectedAlert,
                    });
                }, 300);
            }
            setWasDeviceDisconnectedByUserAction(false);
        });
    }, [
        debounce,
        navigation,
        showAlert,
        translate,
        hideDeviceDisconnectedAlert,
        wasDeviceDisconnectedByUserAction,
        setWasDeviceDisconnectedByUserAction,
    ]);

    return { handleOnboardingDeviceDisconnection, isOnboardingDeviceDisconnectedAlertDisplayed };
};
