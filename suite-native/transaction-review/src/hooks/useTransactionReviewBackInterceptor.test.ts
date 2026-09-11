import { renderHookWithBasicProvider, waitFor } from '@suite-native/test-utils';

import { useTransactionReviewBackInterceptor } from './useTransactionReviewBackInterceptor';

const mockShowCancellationAlert = jest.fn();
const mockUseNavigationRemoveActionInterceptor = jest.fn();

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useNavigationRemoveActionInterceptor: (props: {
        isEnabled: boolean;
        onInterceptedAction: () => void;
    }) => {
        mockUseNavigationRemoveActionInterceptor(props);
        props.onInterceptedAction();
    },
}));

jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    useShowReviewCancellationAlert: () => mockShowCancellationAlert,
}));

describe('useTransactionReviewBackInterceptor', () => {
    const renderInterceptor = async ({
        isEnabled,
        onReviewCanceled = jest.fn(),
    }: { isEnabled?: boolean; onReviewCanceled?: () => void } = {}) =>
        await renderHookWithBasicProvider(() =>
            useTransactionReviewBackInterceptor({ isEnabled, onReviewCanceled }),
        );

    beforeEach(() => {
        jest.clearAllMocks();
        mockShowCancellationAlert.mockResolvedValue({ wasReviewCanceled: true });
    });

    it('should show the cancellation alert on an intercepted back action', async () => {
        await renderInterceptor();

        expect(mockShowCancellationAlert).toHaveBeenCalledTimes(1);
    });

    it('should call onReviewCanceled when the review was canceled', async () => {
        const onReviewCanceled = jest.fn();

        await renderInterceptor({ onReviewCanceled });

        await waitFor(() => expect(onReviewCanceled).toHaveBeenCalledTimes(1));
    });

    it('should not call onReviewCanceled when the user continues the review', async () => {
        const onReviewCanceled = jest.fn();
        mockShowCancellationAlert.mockResolvedValue({ wasReviewCanceled: false });

        await renderInterceptor({ onReviewCanceled });

        await Promise.resolve();
        expect(onReviewCanceled).not.toHaveBeenCalled();
    });

    it('should be enabled by default', async () => {
        await renderInterceptor();

        expect(mockUseNavigationRemoveActionInterceptor).toHaveBeenCalledWith(
            expect.objectContaining({ isEnabled: true }),
        );
    });

    it('should forward an explicit disable to the navigation interceptor', async () => {
        await renderInterceptor({ isEnabled: false });

        expect(mockUseNavigationRemoveActionInterceptor).toHaveBeenCalledWith(
            expect.objectContaining({ isEnabled: false }),
        );
    });
});
