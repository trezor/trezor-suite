import { useCallback } from 'react';

import { useNavigateToInitialScreen, useOverrideBackNavigation } from '@suite-native/navigation';

import { useShowReviewCancellationAlert } from './useShowReviewCancellationAlert';

export const useOutputsReviewBackInterceptor = () => {
    const showReviewCancellationAlert = useShowReviewCancellationAlert();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const onNavigateBack = useCallback(async () => {
        const { wasReviewCanceled } = await showReviewCancellationAlert();

        if (wasReviewCanceled) {
            navigateToInitialScreen();
        }
    }, [navigateToInitialScreen, showReviewCancellationAlert]);

    useOverrideBackNavigation({ onNavigateBack });
};
