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

export const useShowPushTransactionFailedDuringUnstakeReviewAlert = () => {
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
                    <Translation id="earn.unstakeTransactionDataReviewScreen.pushTransactionFailedAlert.title" />
                ),
                description: (
                    <Translation id="earn.unstakeTransactionDataReviewScreen.pushTransactionFailedAlert.description" />
                ),
                primaryButtonTitle: (
                    <Translation id="earn.unstakeTransactionDataReviewScreen.pushTransactionFailedAlert.primaryButton" />
                ),
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                onPressPrimaryButton: handleGoHome,
            }),
        [handleGoHome, showAlert],
    );

    const showPendingTransactionConflictAlert = useCallback(
        () =>
            showAlert({
                title: (
                    <Translation id="earn.unstakeTransactionDataReviewScreen.pendingTransactionConflictAlert.title" />
                ),
                description: (
                    <Translation id="earn.unstakeTransactionDataReviewScreen.pendingTransactionConflictAlert.description" />
                ),
                primaryButtonTitle: (
                    <Translation id="earn.unstakeTransactionDataReviewScreen.pendingTransactionConflictAlert.primaryButton" />
                ),
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                onPressPrimaryButton: handleGoHome,
            }),
        [handleGoHome, showAlert],
    );

    return { showPushTransactionFailedAlert, showPendingTransactionConflictAlert };
};
