import { useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import {
    StackToStackCompositeNavigationProps,
    SendStackParamList,
    SendStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    AppTabsRoutes,
    HomeStackRoutes,
    AuthorizeDeviceStackRoutes,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview,
    RootStackParamList
>;

export const useShowDeviceDisconnectedAlert = () => {
    const { showAlert } = useAlert();
    const navigation = useNavigation<NavigationProps>();

    const handleReconnect = () => {
        navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
            screen: AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
            params: {
                // If user cancels the re-connecting process, redirect him to the Home screen.
                onCancelNavigationTarget: {
                    name: RootStackRoutes.AppTabs,
                    params: {
                        screen: AppTabsRoutes.HomeStack,
                        params: { screen: HomeStackRoutes.Home },
                    },
                },
            },
        });
    };

    const handleCancel = () => {
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: { screen: HomeStackRoutes.Home },
        });
    };

    const showReviewCancellationAlert = () =>
        setTimeout(
            // Timeout is needed to prevent the alert from being shown before the redirect from @suite-native/device - useHandleDeviceConnection hook happens.
            () =>
                showAlert({
                    title: <Translation id="moduleSend.review.deviceDisconnectedAlert.title" />,
                    description: (
                        <Translation id="moduleSend.review.deviceDisconnectedAlert.description" />
                    ),
                    primaryButtonTitle: (
                        <Translation id="moduleSend.review.deviceDisconnectedAlert.primaryButton" />
                    ),
                    primaryButtonVariant: 'redBold',
                    secondaryButtonVariant: 'redElevation0',
                    secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                    onPressPrimaryButton: handleReconnect,
                    onPressSecondaryButton: handleCancel,
                }),
            1000,
        );

    return showReviewCancellationAlert;
};
