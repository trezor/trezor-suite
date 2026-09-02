import { useCallback } from 'react';

import { type YieldReviewSigningResult } from '../../types';
import { type ReviewAutoStartControls, useAutoStartReview } from '../earn/useAutoStartReview';

type UseYieldReviewAutoStartParams = {
    onDeviceReviewReady: () => void;
    onReviewCancelled: () => Promise<void> | void;
    onReviewFailed: () => void;
    shouldAutoStartReview: boolean;
    startReview: () => Promise<YieldReviewSigningResult>;
};

export const useYieldReviewAutoStart = ({
    onDeviceReviewReady,
    onReviewCancelled,
    onReviewFailed,
    shouldAutoStartReview,
    startReview,
}: UseYieldReviewAutoStartParams) => {
    const onReviewSettled = useCallback(
        async (result: YieldReviewSigningResult, { allowRestart }: ReviewAutoStartControls) => {
            if (result === 'not-ready') {
                allowRestart();

                return;
            }

            if (result === 'cancelled') {
                await onReviewCancelled();

                return;
            }

            if (result === 'failed') {
                onReviewFailed();
            }
        },
        [onReviewCancelled, onReviewFailed],
    );

    useAutoStartReview({
        shouldAutoStartReview,
        startReview,
        onDeviceReviewReady,
        onReviewSettled,
    });
};
