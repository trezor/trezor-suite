import { renderHookWithProviders, waitFor } from '@suite-native/test-utils';

import { useOutputsReviewBackInterceptor } from '../useOutputsReviewBackInterceptor';

const mockShowReviewCancellationAlert = jest.fn();

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useOverrideBackNavigation: ({ onNavigateBack }: { onNavigateBack: () => void }) =>
        onNavigateBack(),
}));

jest.mock('../useShowReviewCancellationAlert', () => ({
    useShowReviewCancellationAlert: () => mockShowReviewCancellationAlert,
}));

describe('useOutputsReviewBackInterceptor', () => {
    const renderUseOutputsReviewBackInterceptor = (onReviewCanceled: () => void = jest.fn()) =>
        renderHookWithProviders(() => useOutputsReviewBackInterceptor(onReviewCanceled), {
            providers: ['intl'],
        });

    beforeEach(() => {
        jest.clearAllMocks();
        mockShowReviewCancellationAlert.mockReturnValue(
            Promise.resolve({ wasReviewCanceled: true }),
        );
    });

    it('should call showReviewCancellationAlert onBack action', () => {
        renderUseOutputsReviewBackInterceptor();

        expect(mockShowReviewCancellationAlert).toHaveBeenCalledTimes(1);
    });

    it('should call onReviewCanceled if review was canceled', async () => {
        const mockOnReviewCanceled = jest.fn();

        renderUseOutputsReviewBackInterceptor(mockOnReviewCanceled);

        await waitFor(() => {
            expect(mockOnReviewCanceled).toHaveBeenCalledTimes(1);
        });
    });

    it('should not call onReviewCanceled if review was not canceled', async () => {
        const mockOnReviewCanceled = jest.fn();
        mockShowReviewCancellationAlert.mockReturnValue(
            Promise.resolve({ wasReviewCanceled: false }),
        );
        renderUseOutputsReviewBackInterceptor(mockOnReviewCanceled);

        await Promise.resolve(); // wait for the promise in the hook to resolve
        expect(mockOnReviewCanceled).toHaveBeenCalledTimes(0);
    });
});
