import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import {
    type AppTabsParamList,
    AppTabsRoutes,
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

export const useShowPushTransactionFailedDuringEarnReviewAlert = () => {
    const { showAlert } = useAlert();
    const navigation = useNavigation<NavigationProps>();

    const handleGoHome = useCallback(() => {
        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: { screen: HomeStackRoutes.Home },
        });
    }, [navigation]);

    const showPushTransactionFailedAlert = useCallback(
        () =>
            showAlert({
                title: (
                    <Translation id="earn.earnTransactionDataReviewScreen.pushTransactionFailedAlert.title" />
                ),
                description: (
                    <Translation id="earn.earnTransactionDataReviewScreen.pushTransactionFailedAlert.description" />
                ),
                primaryButtonTitle: (
                    <Translation id="earn.earnTransactionDataReviewScreen.pushTransactionFailedAlert.primaryButton" />
                ),
                primaryButtonVariant: 'redBold',
                onPressPrimaryButton: handleGoHome,
            }),
        [handleGoHome, showAlert],
    );

    const showPendingTransactionConflictAlert = useCallback(
        () =>
            showAlert({
                title: (
                    <Translation id="earn.earnTransactionDataReviewScreen.pendingTransactionConflictAlert.title" />
                ),
                description: (
                    <Translation id="earn.earnTransactionDataReviewScreen.pendingTransactionConflictAlert.description" />
                ),
                primaryButtonTitle: (
                    <Translation id="earn.earnTransactionDataReviewScreen.pendingTransactionConflictAlert.primaryButton" />
                ),
                primaryButtonVariant: 'redBold',
                onPressPrimaryButton: handleGoHome,
            }),
        [handleGoHome, showAlert],
    );

    return { showPushTransactionFailedAlert, showPendingTransactionConflictAlert };
};
