import { renderHookWithBasicProvider, waitFor } from '@suite-native/test-utils';

import { useOutputsReviewBackInterceptor } from './useOutputsReviewBackInterceptor';

const mockShowReviewCancellationAlert = jest.fn();

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useNavigationRemoveActionInterceptor: ({
        onInterceptedAction,
    }: {
        onInterceptedAction: () => void;
    }) => onInterceptedAction(),
}));

jest.mock('./useShowReviewCancellationAlert', () => ({
    useShowReviewCancellationAlert: () => mockShowReviewCancellationAlert,
}));

describe('useOutputsReviewBackInterceptor', () => {
    const renderUseOutputsReviewBackInterceptor = async (
        onReviewCanceled: () => void = jest.fn(),
    ) => await renderHookWithBasicProvider(() => useOutputsReviewBackInterceptor(onReviewCanceled));

    beforeEach(() => {
        jest.clearAllMocks();
        mockShowReviewCancellationAlert.mockReturnValue(
            Promise.resolve({ wasReviewCanceled: true }),
        );
    });

    it('should call showReviewCancellationAlert onBack action', async () => {
        await renderUseOutputsReviewBackInterceptor();

        expect(mockShowReviewCancellationAlert).toHaveBeenCalledTimes(1);
    });

    it('should call onReviewCanceled if review was canceled', async () => {
        const mockOnReviewCanceled = jest.fn();

        await renderUseOutputsReviewBackInterceptor(mockOnReviewCanceled);

        await waitFor(() => {
            expect(mockOnReviewCanceled).toHaveBeenCalledTimes(1);
        });
    });

    it('should not call onReviewCanceled if review was not canceled', async () => {
        const mockOnReviewCanceled = jest.fn();
        mockShowReviewCancellationAlert.mockReturnValue(
            Promise.resolve({ wasReviewCanceled: false }),
        );
        await renderUseOutputsReviewBackInterceptor(mockOnReviewCanceled);

        await Promise.resolve(); // wait for the promise in the hook to resolve
        expect(mockOnReviewCanceled).toHaveBeenCalledTimes(0);
    });
});
