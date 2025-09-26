import { useCallback } from 'react';

import { useOverrideBackNavigation } from '@suite-native/navigation';

import { useShowReviewCancellationAlert } from './useShowReviewCancellationAlert';

export const useOutputsReviewBackInterceptor = (onReviewCanceled: () => void) => {
    const showReviewCancellationAlert = useShowReviewCancellationAlert();

    const onNavigateBack = useCallback(async () => {
        const { wasReviewCanceled } = await showReviewCancellationAlert();

        if (wasReviewCanceled) {
            onReviewCanceled();
        }
    }, [onReviewCanceled, showReviewCancellationAlert]);

    useOverrideBackNavigation({ onNavigateBack });
};
