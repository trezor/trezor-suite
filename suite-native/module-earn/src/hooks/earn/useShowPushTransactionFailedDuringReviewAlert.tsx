import { useCallback } from 'react';

import { StackActions, useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { Translation, type TxKeyPath } from '@suite-native/intl';

export type ReviewFormType =
    | 'stake'
    | 'unstake'
    | 'claim'
    | 'yield-approval'
    | 'yield-deposit'
    | 'yield-revoke'
    | 'yield-withdraw'
    | 'yield-claim'
    | 'wrap-native'
    | 'unwrap-native';

export type ReviewAlertKind = 'pushFailed' | 'pendingConflict' | 'signFailed';

type AlertKeys = {
    title: TxKeyPath;
    description: TxKeyPath;
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
        },
        pendingConflict: {
            title: 'earn.earnTransactionDataReviewScreen.pendingTransactionConflictAlert.title',
            description:
                'earn.earnTransactionDataReviewScreen.pendingTransactionConflictAlert.description',
        },
        signFailed: {
            title: 'earn.earnTransactionDataReviewScreen.signTransactionFailedAlert.title',
            description:
                'earn.earnTransactionDataReviewScreen.signTransactionFailedAlert.description',
        },
    },
    unstake: {
        pushFailed: {
            title: 'earn.unstakeTransactionDataReviewScreen.pushTransactionFailedAlert.title',
            description:
                'earn.unstakeTransactionDataReviewScreen.pushTransactionFailedAlert.description',
        },
        pendingConflict: {
            title: 'earn.unstakeTransactionDataReviewScreen.pendingTransactionConflictAlert.title',
            description:
                'earn.unstakeTransactionDataReviewScreen.pendingTransactionConflictAlert.description',
        },
        signFailed: {
            title: 'earn.unstakeTransactionDataReviewScreen.signTransactionFailedAlert.title',
            description:
                'earn.unstakeTransactionDataReviewScreen.signTransactionFailedAlert.description',
        },
    },
    claim: {
        pushFailed: {
            title: 'earn.claimTransactionDataReviewScreen.pushTransactionFailedAlert.title',
            description:
                'earn.claimTransactionDataReviewScreen.pushTransactionFailedAlert.description',
        },
        pendingConflict: {
            title: 'earn.claimTransactionDataReviewScreen.pendingTransactionConflictAlert.title',
            description:
                'earn.claimTransactionDataReviewScreen.pendingTransactionConflictAlert.description',
        },
        signFailed: {
            title: 'earn.claimTransactionDataReviewScreen.signTransactionFailedAlert.title',
            description:
                'earn.claimTransactionDataReviewScreen.signTransactionFailedAlert.description',
        },
    },
    'yield-approval': {
        signFailed: {
            title: 'earn.yieldReview.alerts.approval.signTransactionFailed.title',
            description: 'earn.yieldReview.alerts.approval.signTransactionFailed.description',
        },
        pushFailed: {
            title: 'earn.yieldReview.alerts.approval.pushTransactionFailed.title',
            description: 'earn.yieldReview.alerts.approval.pushTransactionFailed.description',
        },
        pendingConflict: {
            title: 'earn.yieldReview.alerts.approval.pendingTransactionConflict.title',
            description: 'earn.yieldReview.alerts.approval.pendingTransactionConflict.description',
        },
    },
    'yield-deposit': {
        signFailed: {
            title: 'earn.yieldReview.alerts.deposit.signTransactionFailed.title',
            description: 'earn.yieldReview.alerts.deposit.signTransactionFailed.description',
        },
        pushFailed: {
            title: 'earn.yieldReview.alerts.deposit.pushTransactionFailed.title',
            description: 'earn.yieldReview.alerts.deposit.pushTransactionFailed.description',
        },
        pendingConflict: {
            title: 'earn.yieldReview.alerts.deposit.pendingTransactionConflict.title',
            description: 'earn.yieldReview.alerts.deposit.pendingTransactionConflict.description',
        },
    },
    'yield-revoke': {
        signFailed: {
            title: 'earn.yieldReview.alerts.revoke.signTransactionFailed.title',
            description: 'earn.yieldReview.alerts.revoke.signTransactionFailed.description',
        },
        pushFailed: {
            title: 'earn.yieldReview.alerts.revoke.pushTransactionFailed.title',
            description: 'earn.yieldReview.alerts.revoke.pushTransactionFailed.description',
        },
        pendingConflict: {
            title: 'earn.yieldReview.alerts.revoke.pendingTransactionConflict.title',
            description: 'earn.yieldReview.alerts.revoke.pendingTransactionConflict.description',
        },
    },
    'yield-withdraw': {
        signFailed: {
            title: 'earn.yieldReview.alerts.withdraw.signTransactionFailed.title',
            description: 'earn.yieldReview.alerts.withdraw.signTransactionFailed.description',
        },
        pushFailed: {
            title: 'earn.yieldReview.alerts.withdraw.pushTransactionFailed.title',
            description: 'earn.yieldReview.alerts.withdraw.pushTransactionFailed.description',
        },
        pendingConflict: {
            title: 'earn.yieldReview.alerts.withdraw.pendingTransactionConflict.title',
            description: 'earn.yieldReview.alerts.withdraw.pendingTransactionConflict.description',
        },
    },
    'yield-claim': {
        signFailed: {
            title: 'earn.yieldReview.alerts.claim.signTransactionFailed.title',
            description: 'earn.yieldReview.alerts.claim.signTransactionFailed.description',
        },
        pushFailed: {
            title: 'earn.yieldReview.alerts.claim.pushTransactionFailed.title',
            description: 'earn.yieldReview.alerts.claim.pushTransactionFailed.description',
        },
        pendingConflict: {
            title: 'earn.yieldReview.alerts.claim.pendingTransactionConflict.title',
            description: 'earn.yieldReview.alerts.claim.pendingTransactionConflict.description',
        },
    },
    'wrap-native': {
        signFailed: {
            title: 'earn.yieldReview.alerts.wrap.signTransactionFailed.title',
            description: 'earn.yieldReview.alerts.wrap.signTransactionFailed.description',
        },
        pushFailed: {
            title: 'earn.yieldReview.alerts.wrap.pushTransactionFailed.title',
            description: 'earn.yieldReview.alerts.wrap.pushTransactionFailed.description',
        },
        pendingConflict: {
            title: 'earn.yieldReview.alerts.wrap.pendingTransactionConflict.title',
            description: 'earn.yieldReview.alerts.wrap.pendingTransactionConflict.description',
        },
    },
    'unwrap-native': {
        signFailed: {
            title: 'earn.yieldReview.alerts.unwrap.signTransactionFailed.title',
            description: 'earn.yieldReview.alerts.unwrap.signTransactionFailed.description',
        },
        pushFailed: {
            title: 'earn.yieldReview.alerts.unwrap.pushTransactionFailed.title',
            description: 'earn.yieldReview.alerts.unwrap.pushTransactionFailed.description',
        },
        pendingConflict: {
            title: 'earn.yieldReview.alerts.unwrap.pendingTransactionConflict.title',
            description: 'earn.yieldReview.alerts.unwrap.pendingTransactionConflict.description',
        },
    },
} as const satisfies Record<ReviewFormType, AlertTranslationKeys>;

export const useShowPushTransactionFailedDuringReviewAlert = (formType: ReviewFormType) => {
    const { showAlert } = useAlert();
    const navigation = useNavigation();
    const keys: AlertTranslationKeys = translationKeys[formType];

    const handleGoBack = useCallback(() => {
        navigation.dispatch(StackActions.pop());
    }, [navigation]);

    const showReviewAlert = useCallback(
        (kind: ReviewAlertKind) => {
            const alertKeys = keys[kind];

            showAlert({
                title: <Translation id={alertKeys.title} />,
                description: <Translation id={alertKeys.description} />,
                primaryButtonTitle: <Translation id="generic.buttons.goBack" />,
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                onPressPrimaryButton: handleGoBack,
            });
        },
        [handleGoBack, keys, showAlert],
    );

    return { showReviewAlert };
};
