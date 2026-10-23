import { useCallback } from 'react';

import { BACK_NAVIGATION_ACTIONS, useNavigationRemoveGuard } from '@suite-native/navigation';
import { useShowReviewCancellationAlert } from '@suite-native/transaction-management';

interface UseTransactionReviewBackInterceptorProps {
    isEnabled?: boolean;
    onReviewCanceled: () => void;
}

export const useTransactionReviewBackInterceptor = ({
    isEnabled = true,
    onReviewCanceled,
}: UseTransactionReviewBackInterceptorProps) => {
    const showReviewCancellationAlert = useShowReviewCancellationAlert();

    const onPreventedRemove = useCallback(async () => {
        const { wasReviewCanceled } = await showReviewCancellationAlert();

        if (wasReviewCanceled) {
            onReviewCanceled();
        }
    }, [onReviewCanceled, showReviewCancellationAlert]);

    useNavigationRemoveGuard({
        isEnabled,
        actionTypes: BACK_NAVIGATION_ACTIONS,
        onBlocked: onPreventedRemove,
    });
};
