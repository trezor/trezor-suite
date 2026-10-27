import { useNavigationRemoveGuard } from '@suite-native/navigation';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useTransactionReviewBackInterceptor } from './useTransactionReviewBackInterceptor';

const mockShowCancellationAlert = jest.fn();

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useNavigationRemoveGuard: jest.fn(),
}));

jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    useShowReviewCancellationAlert: () => mockShowCancellationAlert,
}));

describe('useTransactionReviewBackInterceptor', () => {
    const renderInterceptor = async ({
        isEnabled,
        onReviewCanceled = jest.fn(),
    }: { isEnabled?: boolean; onReviewCanceled?: () => void } = {}) => {
        await renderHookWithBasicProvider(() =>
            useTransactionReviewBackInterceptor({ isEnabled, onReviewCanceled }),
        );

        return jest.mocked(useNavigationRemoveGuard).mock.calls.at(-1)?.[0];
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([true, false])(
        'only calls onReviewCanceled when the cancellation is confirmed: %s',
        async wasReviewCanceled => {
            const onReviewCanceled = jest.fn();
            const continueNavigation = jest.fn();
            mockShowCancellationAlert.mockResolvedValue({ wasReviewCanceled });

            const options = await renderInterceptor({ onReviewCanceled });

            await options?.onBlocked?.({ action: { type: 'POP' }, continueNavigation });

            expect(mockShowCancellationAlert).toHaveBeenCalledTimes(1);
            expect(onReviewCanceled).toHaveBeenCalledTimes(wasReviewCanceled ? 1 : 0);
            expect(continueNavigation).not.toHaveBeenCalled();
        },
    );

    it('should be enabled by default', async () => {
        const options = await renderInterceptor();

        expect(options?.isEnabled).toBe(true);
    });

    it('should forward an explicit disable to the navigation guard', async () => {
        const options = await renderInterceptor({ isEnabled: false });

        expect(options?.isEnabled).toBe(false);
    });
});
