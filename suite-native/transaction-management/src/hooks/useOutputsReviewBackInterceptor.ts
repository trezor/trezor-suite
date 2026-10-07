import { useCallback } from 'react';

import { BACK_NAVIGATION_ACTIONS, useNavigationRemoveGuard } from '@suite-native/navigation';

import { useShowReviewCancellationAlert } from './useShowReviewCancellationAlert';

export const useOutputsReviewBackInterceptor = (onReviewCanceled: () => void) => {
    const showReviewCancellationAlert = useShowReviewCancellationAlert();

    const onPreventedRemove = useCallback(async () => {
        const { wasReviewCanceled } = await showReviewCancellationAlert();

        if (wasReviewCanceled) {
            onReviewCanceled();
        }
    }, [onReviewCanceled, showReviewCancellationAlert]);

    useNavigationRemoveGuard({
        actionTypes: BACK_NAVIGATION_ACTIONS,
        onBlocked: onPreventedRemove,
    });
};
