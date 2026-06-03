import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import {
    type AppTabsParamList,
    AppTabsRoutes,
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type ReviewFormType =
    | 'stake'
    | 'unstake'
    | 'claim'
    | 'yield-approval'
    | 'yield-deposit'
    | 'yield-revoke'
    | 'yield-withdraw';

type NavigationProps = StackToStackCompositeNavigationProps<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

type AlertKeys = {
    title: TxKeyPath;
    description: TxKeyPath;
    primaryButton: TxKeyPath;
};

type AlertTranslationKeys = {
    pushFailed: AlertKeys;
    pendingConflict: AlertKeys;
    signFailed?: AlertKeys;
};

const translationKeys = {
    stake: {
        pushFailed: {
            title: 'earn.earnTransactionDataReviewScreen.pushTransactionFailedAlert.title',
            description:
                'earn.earnTransactionDataReviewScreen.pushTransactionFailedAlert.description',
            primaryButton:
                'earn.earnTransactionDataReviewScreen.pushTransactionFailedAlert.primaryButton',
        },
        pendingConflict: {
            title: 'earn.earnTransactionDataReviewScreen.pendingTransactionConflictAlert.title',
            description:
                'earn.earnTransactionDataReviewScreen.pendingTransactionConflictAlert.description',
            primaryButton:
                'earn.earnTransactionDataReviewScreen.pendingTransactionConflictAlert.primaryButton',
        },
    },
    unstake: {
        pushFailed: {
            title: 'earn.unstakeTransactionDataReviewScreen.pushTransactionFailedAlert.title',
            description:
                'earn.unstakeTransactionDataReviewScreen.pushTransactionFailedAlert.description',
            primaryButton:
                'earn.unstakeTransactionDataReviewScreen.pushTransactionFailedAlert.primaryButton',
        },
        pendingConflict: {
            title: 'earn.unstakeTransactionDataReviewScreen.pendingTransactionConflictAlert.title',
            description:
                'earn.unstakeTransactionDataReviewScreen.pendingTransactionConflictAlert.description',
            primaryButton:
                'earn.unstakeTransactionDataReviewScreen.pendingTransactionConflictAlert.primaryButton',
        },
    },
    claim: {
        pushFailed: {
            title: 'earn.claimTransactionDataReviewScreen.pushTransactionFailedAlert.title',
            description:
                'earn.claimTransactionDataReviewScreen.pushTransactionFailedAlert.description',
            primaryButton:
                'earn.claimTransactionDataReviewScreen.pushTransactionFailedAlert.primaryButton',
        },
        pendingConflict: {
            title: 'earn.claimTransactionDataReviewScreen.pendingTransactionConflictAlert.title',
            description:
                'earn.claimTransactionDataReviewScreen.pendingTransactionConflictAlert.description',
            primaryButton:
                'earn.claimTransactionDataReviewScreen.pendingTransactionConflictAlert.primaryButton',
        },
    },
    'yield-approval': {
        pushFailed: {
            title: 'earn.yieldReview.alerts.approval.pushTransactionFailed.title',
            description: 'earn.yieldReview.alerts.approval.pushTransactionFailed.description',
            primaryButton: 'earn.yieldReview.alerts.primaryButton',
        },
        pendingConflict: {
            title: 'earn.yieldReview.alerts.approval.pendingTransactionConflict.title',
            description: 'earn.yieldReview.alerts.approval.pendingTransactionConflict.description',
            primaryButton: 'earn.yieldReview.alerts.primaryButton',
        },
    },
    'yield-deposit': {
        signFailed: {
            title: 'earn.yieldReview.alerts.deposit.signTransactionFailed.title',
            description: 'earn.yieldReview.alerts.deposit.signTransactionFailed.description',
            primaryButton: 'earn.yieldReview.alerts.primaryButton',
        },
        pushFailed: {
            title: 'earn.yieldReview.alerts.deposit.pushTransactionFailed.title',
            description: 'earn.yieldReview.alerts.deposit.pushTransactionFailed.description',
            primaryButton: 'earn.yieldReview.alerts.primaryButton',
        },
        pendingConflict: {
            title: 'earn.yieldReview.alerts.deposit.pendingTransactionConflict.title',
            description: 'earn.yieldReview.alerts.deposit.pendingTransactionConflict.description',
            primaryButton: 'earn.yieldReview.alerts.primaryButton',
        },
    },
    'yield-revoke': {
        pushFailed: {
            title: 'earn.yieldReview.alerts.revoke.pushTransactionFailed.title',
            description: 'earn.yieldReview.alerts.revoke.pushTransactionFailed.description',
            primaryButton: 'earn.yieldReview.alerts.primaryButton',
        },
        pendingConflict: {
            title: 'earn.yieldReview.alerts.revoke.pendingTransactionConflict.title',
            description: 'earn.yieldReview.alerts.revoke.pendingTransactionConflict.description',
            primaryButton: 'earn.yieldReview.alerts.primaryButton',
        },
    },
    'yield-withdraw': {
        signFailed: {
            title: 'earn.yieldReview.alerts.withdraw.signTransactionFailed.title',
            description: 'earn.yieldReview.alerts.withdraw.signTransactionFailed.description',
            primaryButton: 'earn.yieldReview.alerts.primaryButton',
        },
        pushFailed: {
            title: 'earn.yieldReview.alerts.withdraw.pushTransactionFailed.title',
            description: 'earn.yieldReview.alerts.withdraw.pushTransactionFailed.description',
            primaryButton: 'earn.yieldReview.alerts.primaryButton',
        },
        pendingConflict: {
            title: 'earn.yieldReview.alerts.withdraw.pendingTransactionConflict.title',
            description: 'earn.yieldReview.alerts.withdraw.pendingTransactionConflict.description',
            primaryButton: 'earn.yieldReview.alerts.primaryButton',
        },
    },
} as const satisfies Record<ReviewFormType, AlertTranslationKeys>;

export const useShowPushTransactionFailedDuringReviewAlert = (formType: ReviewFormType) => {
    const { showAlert } = useAlert();
    const navigation = useNavigation<NavigationProps>();
    const keys: AlertTranslationKeys = translationKeys[formType];

    const handleGoHome = useCallback(() => {
        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: { screen: HomeStackRoutes.Home },
        });
    }, [navigation]);

    const showPushTransactionFailedAlert = useCallback(
        () =>
            showAlert({
                title: <Translation id={keys.pushFailed.title} />,
                description: <Translation id={keys.pushFailed.description} />,
                primaryButtonTitle: <Translation id={keys.pushFailed.primaryButton} />,
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                onPressPrimaryButton: handleGoHome,
            }),
        [handleGoHome, keys, showAlert],
    );

    const showPendingTransactionConflictAlert = useCallback(
        () =>
            showAlert({
                title: <Translation id={keys.pendingConflict.title} />,
                description: <Translation id={keys.pendingConflict.description} />,
                primaryButtonTitle: <Translation id={keys.pendingConflict.primaryButton} />,
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                onPressPrimaryButton: handleGoHome,
            }),
        [handleGoHome, keys, showAlert],
    );

    const showSignTransactionFailedAlert = useCallback(() => {
        if (!keys.signFailed) {
            return;
        }

        showAlert({
            title: <Translation id={keys.signFailed.title} />,
            description: <Translation id={keys.signFailed.description} />,
            primaryButtonTitle: <Translation id={keys.signFailed.primaryButton} />,
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            onPressPrimaryButton: handleGoHome,
        });
    }, [handleGoHome, keys, showAlert]);

    return {
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
        showSignTransactionFailedAlert,
    };
};
