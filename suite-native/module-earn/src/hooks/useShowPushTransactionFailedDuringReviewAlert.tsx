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

export type ReviewFormType =
    | 'stake'
    | 'unstake'
    | 'claim'
    | 'yield-approval'
    | 'yield-deposit'
    | 'yield-revoke'
    | 'yield-withdraw'
    | 'yield-claim';

export type ReviewAlertKind = 'pushFailed' | 'pendingConflict' | 'signFailed';

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
    signFailed: AlertKeys;
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
        signFailed: {
            title: 'earn.earnTransactionDataReviewScreen.signTransactionFailedAlert.title',
            description:
                'earn.earnTransactionDataReviewScreen.signTransactionFailedAlert.description',
            primaryButton:
                'earn.earnTransactionDataReviewScreen.signTransactionFailedAlert.primaryButton',
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
        signFailed: {
            title: 'earn.unstakeTransactionDataReviewScreen.signTransactionFailedAlert.title',
            description:
                'earn.unstakeTransactionDataReviewScreen.signTransactionFailedAlert.description',
            primaryButton:
                'earn.unstakeTransactionDataReviewScreen.signTransactionFailedAlert.primaryButton',
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
        signFailed: {
            title: 'earn.claimTransactionDataReviewScreen.signTransactionFailedAlert.title',
            description:
                'earn.claimTransactionDataReviewScreen.signTransactionFailedAlert.description',
            primaryButton:
                'earn.claimTransactionDataReviewScreen.signTransactionFailedAlert.primaryButton',
        },
    },
    'yield-approval': {
        signFailed: {
            title: 'earn.yieldReview.alerts.approval.signTransactionFailed.title',
            description: 'earn.yieldReview.alerts.approval.signTransactionFailed.description',
            primaryButton: 'earn.yieldReview.alerts.primaryButton',
        },
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
        signFailed: {
            title: 'earn.yieldReview.alerts.revoke.signTransactionFailed.title',
            description: 'earn.yieldReview.alerts.revoke.signTransactionFailed.description',
            primaryButton: 'earn.yieldReview.alerts.primaryButton',
        },
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
    'yield-claim': {
        signFailed: {
            title: 'earn.yieldReview.alerts.claim.signTransactionFailed.title',
            description: 'earn.yieldReview.alerts.claim.signTransactionFailed.description',
            primaryButton: 'earn.yieldReview.alerts.primaryButton',
        },
        pushFailed: {
            title: 'earn.yieldReview.alerts.claim.pushTransactionFailed.title',
            description: 'earn.yieldReview.alerts.claim.pushTransactionFailed.description',
            primaryButton: 'earn.yieldReview.alerts.primaryButton',
        },
        pendingConflict: {
            title: 'earn.yieldReview.alerts.claim.pendingTransactionConflict.title',
            description: 'earn.yieldReview.alerts.claim.pendingTransactionConflict.description',
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

    const showReviewAlert = useCallback(
        (kind: ReviewAlertKind) => {
            const alertKeys = keys[kind];

            showAlert({
                title: <Translation id={alertKeys.title} />,
                description: <Translation id={alertKeys.description} />,
                primaryButtonTitle: <Translation id={alertKeys.primaryButton} />,
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                onPressPrimaryButton: handleGoHome,
            });
        },
        [handleGoHome, keys, showAlert],
    );

    return { showReviewAlert };
};
