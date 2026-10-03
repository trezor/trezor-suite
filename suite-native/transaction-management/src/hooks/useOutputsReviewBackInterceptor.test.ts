import { useNavigationRemoveGuard } from '@suite-native/navigation';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useOutputsReviewBackInterceptor } from './useOutputsReviewBackInterceptor';

const mockShowReviewCancellationAlert = jest.fn();

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useNavigationRemoveGuard: jest.fn(),
}));

jest.mock('./useShowReviewCancellationAlert', () => ({
    useShowReviewCancellationAlert: () => mockShowReviewCancellationAlert,
}));

describe('useOutputsReviewBackInterceptor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([true, false])(
        'only calls the existing cancellation handler when confirmed: %s',
        async wasReviewCanceled => {
            const onReviewCanceled = jest.fn();
            const continueNavigation = jest.fn();
            mockShowReviewCancellationAlert.mockResolvedValue({ wasReviewCanceled });
            await renderHookWithBasicProvider(() =>
                useOutputsReviewBackInterceptor(onReviewCanceled),
            );
            const options = jest.mocked(useNavigationRemoveGuard).mock.calls.at(-1)?.[0];

            expect(options?.actionTypes).toEqual(['GO_BACK', 'POP']);
            await options?.onBlocked?.({ action: { type: 'POP' }, continueNavigation });

            expect(mockShowReviewCancellationAlert).toHaveBeenCalledTimes(1);
            expect(onReviewCanceled).toHaveBeenCalledTimes(wasReviewCanceled ? 1 : 0);
            expect(continueNavigation).not.toHaveBeenCalled();
        },
    );
});
