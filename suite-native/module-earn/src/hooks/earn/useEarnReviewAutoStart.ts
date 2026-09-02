import { useCallback } from 'react';

import { useAutoStartReview } from './useAutoStartReview';

type UseEarnReviewAutoStartParams = {
    handleSign: () => Promise<boolean>;
    isSigned: boolean;
    canStart: boolean;
    onDeviceReviewReady: () => void;
    onSignFailed: () => void;
};

export const useEarnReviewAutoStart = ({
    handleSign,
    isSigned,
    canStart,
    onDeviceReviewReady,
    onSignFailed,
}: UseEarnReviewAutoStartParams) => {
    const onReviewSettled = useCallback(
        (didSign: boolean) => {
            if (!didSign) {
                onSignFailed();
            }
        },
        [onSignFailed],
    );

    useAutoStartReview({
        shouldAutoStartReview: canStart && !isSigned,
        startReview: handleSign,
        onDeviceReviewReady,
        onReviewSettled,
    });
};
