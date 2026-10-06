import { useEffect, useRef } from 'react';

import { useWaitForButtonRequest } from '@suite-native/transaction-management';

export type ReviewAutoStartControls = {
    allowRestart: () => void;
};

type UseAutoStartReviewParams<TResult> = {
    shouldAutoStartReview: boolean;
    startReview: () => Promise<TResult>;
    onDeviceReviewReady: () => void;
    onReviewSettled: (result: TResult, controls: ReviewAutoStartControls) => void | Promise<void>;
};

export const useAutoStartReview = <TResult>({
    shouldAutoStartReview,
    startReview,
    onDeviceReviewReady,
    onReviewSettled,
}: UseAutoStartReviewParams<TResult>) => {
    const hasStartedRef = useRef(false);
    const isMountedRef = useRef(true);
    const waitForDeviceReview = useWaitForButtonRequest(onDeviceReviewReady);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!shouldAutoStartReview || hasStartedRef.current) {
            return;
        }

        hasStartedRef.current = true;
        waitForDeviceReview();

        const start = async () => {
            try {
                const result = await startReview();

                if (!isMountedRef.current) {
                    return;
                }

                await onReviewSettled(result, {
                    allowRestart: () => {
                        hasStartedRef.current = false;
                    },
                });
            } catch {
                hasStartedRef.current = false;
            }
        };

        void start();
    }, [onReviewSettled, shouldAutoStartReview, startReview, waitForDeviceReview]);
};
