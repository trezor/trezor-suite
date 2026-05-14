import { useCallback } from 'react';

import { usePreventNavigationRemove } from '@suite-native/navigation';

import { useShowReviewCancellationAlert } from './useShowReviewCancellationAlert';

export const useOutputsReviewBackInterceptor = (onReviewCanceled: () => void) => {
    const showReviewCancellationAlert = useShowReviewCancellationAlert();

    const onPreventedRemove = useCallback(async () => {
        const { wasReviewCanceled } = await showReviewCancellationAlert();

        if (wasReviewCanceled) {
            onReviewCanceled();
        }
    }, [onReviewCanceled, showReviewCancellationAlert]);

    usePreventNavigationRemove({ onPreventedRemove });
};
