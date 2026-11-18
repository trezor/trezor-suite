import { useNavigationRemoveGuard } from '@suite-native/navigation';
import { useShowReviewCancellationAlert } from '@suite-native/transaction-management';

interface UseTransactionReviewBackInterceptorProps {
    isEnabled?: boolean;
    onReviewCanceled: () => void;
}

export const useTransactionReviewBackInterceptor = ({
    isEnabled = true,
    onReviewCanceled,
}: UseTransactionReviewBackInterceptorProps) => {
    const showReviewCancellationAlert = useShowReviewCancellationAlert();

    useNavigationRemoveGuard({
        isEnabled,
        onBlocked: async ({ forceNavigation }) => {
            const { wasReviewCanceled } = await showReviewCancellationAlert();

            if (wasReviewCanceled) {
                forceNavigation(onReviewCanceled);
            }
        },
    });
};
