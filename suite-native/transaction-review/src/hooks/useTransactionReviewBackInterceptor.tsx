import { useCallback } from 'react';

import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';

import { useTransactionReviewCancellationAlert } from './useTransactionReviewCancellationAlert';

interface UseTransactionReviewBackInterceptorProps {
    isEnabled?: boolean;
    onReviewCanceled: () => void;
}

export const useTransactionReviewBackInterceptor = ({
    isEnabled = true,
    onReviewCanceled,
}: UseTransactionReviewBackInterceptorProps) => {
    const transactionReviewCancellationAlert = useTransactionReviewCancellationAlert();

    const onPreventedRemove = useCallback(async () => {
        const { wasReviewCanceled } = await transactionReviewCancellationAlert.show();

        if (wasReviewCanceled) {
            onReviewCanceled();
        }
    }, [onReviewCanceled, transactionReviewCancellationAlert]);

    useNavigationRemoveActionInterceptor({ isEnabled, onInterceptedAction: onPreventedRemove });
};
