import { useCallback } from 'react';

import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';
import { useTransactionReviewCancellationAlert } from './useTransactionReviewCancellationAlert';

export const useTransactionReviewBackInterceptor = (onReviewCanceled: () => void) => {
    const transactionReviewCancellationAlert = useTransactionReviewCancellationAlert();

    const onPreventedRemove = useCallback(async () => {
        const { wasReviewCanceled } = await transactionReviewCancellationAlert.show();

        if (wasReviewCanceled) {
            onReviewCanceled();
        }
    }, [onReviewCanceled, transactionReviewCancellationAlert.show]);

    useNavigationRemoveActionInterceptor({ onInterceptedAction: onPreventedRemove });
};
