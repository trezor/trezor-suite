import { useEffect, useRef } from 'react';

import { useWaitForButtonRequest } from '@suite-native/transaction-management';

import { type YieldReviewSigningResult } from '../types';

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
    const hasStartedRef = useRef(false);
    const waitForDeviceReview = useWaitForButtonRequest(onDeviceReviewReady);

    useEffect(() => {
        if (!shouldAutoStartReview || hasStartedRef.current) {
            return;
        }

        hasStartedRef.current = true;
        waitForDeviceReview();

        const start = async () => {
            const result = await startReview();

            if (result === 'not-ready') {
                hasStartedRef.current = false;

                return;
            }

            if (result === 'cancelled') {
                await onReviewCancelled();

                return;
            }

            if (result === 'failed') {
                onReviewFailed();
            }
        };

        void start();
    }, [
        onReviewCancelled,
        onReviewFailed,
        shouldAutoStartReview,
        startReview,
        waitForDeviceReview,
    ]);
};
