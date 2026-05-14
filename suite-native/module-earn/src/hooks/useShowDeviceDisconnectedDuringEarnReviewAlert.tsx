import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import {
    type AppTabsParamList,
    AppTabsRoutes,
    AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

export const useShowDeviceDisconnectedDuringEarnReviewAlert = () => {
    const { showAlert } = useAlert();
    const navigation = useNavigation<NavigationProps>();

    const handleReconnect = useCallback(() => {
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
            params: {
                onCancelNavigationTarget: {
                    name: RootStackRoutes.AppTabs,
                    params: {
                        screen: AppTabsRoutes.HomeStack,
                        params: { screen: HomeStackRoutes.Home },
                    },
                },
            },
        });
    }, [navigation]);

    const handleCancel = useCallback(() => {
        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: { screen: HomeStackRoutes.Home },
        });
    }, [navigation]);

    return useCallback(() => {
        const timerId = setTimeout(
            () =>
                showAlert({
                    title: <Translation id="moduleSend.review.deviceDisconnectedAlert.title" />,
                    description: (
                        <Translation id="moduleSend.review.deviceDisconnectedAlert.description" />
                    ),
                    primaryButtonTitle: (
                        <Translation id="moduleSend.review.deviceDisconnectedAlert.primaryButton" />
                    ),
                    primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                    secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
                    secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                    onPressPrimaryButton: handleReconnect,
                    onPressSecondaryButton: handleCancel,
                }),
            1000,
        );

        return () => clearTimeout(timerId);
    }, [handleCancel, handleReconnect, showAlert]);
};
