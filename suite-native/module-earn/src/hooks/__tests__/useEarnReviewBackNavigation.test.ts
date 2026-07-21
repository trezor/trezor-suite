import { type NavigationAction } from '@react-navigation/native';

import { cancelSignSendFormTransactionThunk } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import { useShowReviewCancellationAlert } from '@suite-native/transaction-management';

import { useEarnReviewBackNavigation } from '../useEarnReviewBackNavigation';

const mockDispatch = jest.fn();
const mockNavigationDispatch = jest.fn();
const mockUseSelector = jest.fn();

jest.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('@suite-common/wallet-core', () => ({
    cancelSignSendFormTransactionThunk: jest.fn(() => ({ type: 'cancel-sign' })),
    selectAccountByKey: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        dispatch: mockNavigationDispatch,
        goBack: jest.fn(),
    }),
}));

jest.mock('@suite-native/navigation', () => ({
    AppTabsRoutes: { EarnStack: 'EarnStack' },
    RootStackRoutes: { AppTabs: 'AppTabs' },
    useDisableIOSGesture: jest.fn(),
    useNavigationRemoveActionInterceptor: jest.fn(),
}));

jest.mock('@suite-native/transaction-management', () => ({
    selectIsTransactionReviewInProgress: jest.fn(),
    useShowReviewCancellationAlert: jest.fn(),
}));

jest.mock('../../utils/resolveStakingHomeRoute', () => ({
    resolveStakingHomeRoute: () => ({ name: 'StakingDashboard', params: undefined }),
}));

const mockedUseNavigationRemoveActionInterceptor = jest.mocked(
    useNavigationRemoveActionInterceptor,
);
const mockedUseShowReviewCancellationAlert = jest.mocked(useShowReviewCancellationAlert);

const getInterceptorProps = () => mockedUseNavigationRemoveActionInterceptor.mock.calls.at(-1)?.[0];

const renderUseEarnReviewBackNavigation = (isTransactionReviewInProgress: boolean) => {
    mockUseSelector
        .mockReturnValueOnce(isTransactionReviewInProgress)
        .mockReturnValueOnce({ symbol: 'eth' });

    return renderHookWithBasicProvider(() =>
        useEarnReviewBackNavigation('stake', 'account-key' as AccountKey),
    );
};

describe('useEarnReviewBackNavigation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each(['GO_BACK', 'POP'] as const)(
        'resumes %s navigation after active review cancellation is confirmed',
        async actionType => {
            const action: NavigationAction = { type: actionType };
            mockedUseShowReviewCancellationAlert.mockReturnValue(
                jest.fn().mockResolvedValue({ wasReviewCanceled: true }),
            );
            renderUseEarnReviewBackNavigation(true);

            await act(async () => {
                getInterceptorProps()?.onInterceptedAction?.(action);
                await Promise.resolve();
            });

            expect(getInterceptorProps()?.actionTypesToIntercept).toEqual([
                'GO_BACK',
                'POP',
                'POP_TO_TOP',
            ]);
            expect(cancelSignSendFormTransactionThunk).toHaveBeenCalledTimes(1);
            expect(mockDispatch).toHaveBeenCalledTimes(1);
            expect(mockNavigationDispatch).toHaveBeenCalledWith(action);
        },
    );

    it.each(['GO_BACK', 'POP'] as const)(
        'keeps %s navigation intercepted when cancellation is declined',
        async actionType => {
            mockedUseShowReviewCancellationAlert.mockReturnValue(
                jest.fn().mockResolvedValue({ wasReviewCanceled: false }),
            );
            renderUseEarnReviewBackNavigation(true);

            await act(async () => {
                getInterceptorProps()?.onInterceptedAction?.({ type: actionType });
                await Promise.resolve();
            });

            expect(cancelSignSendFormTransactionThunk).not.toHaveBeenCalled();
            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockNavigationDispatch).not.toHaveBeenCalled();
        },
    );

    it('does not open another cancellation alert while one is already visible', () => {
        const showReviewCancellationAlert = jest.fn(() => new Promise<never>(() => undefined));
        mockedUseShowReviewCancellationAlert.mockReturnValue(showReviewCancellationAlert);
        renderUseEarnReviewBackNavigation(true);

        getInterceptorProps()?.onInterceptedAction?.({ type: 'GO_BACK' });
        getInterceptorProps()?.onInterceptedAction?.({ type: 'POP' });

        expect(showReviewCancellationAlert).toHaveBeenCalledTimes(1);
    });

    it('redirects an inactive review when the whole flow is closed', () => {
        renderUseEarnReviewBackNavigation(false);

        getInterceptorProps()?.onInterceptedAction?.({ type: 'POP_TO_TOP' });

        expect(getInterceptorProps()?.actionTypesToIntercept).toEqual(['POP_TO_TOP']);
        expect(cancelSignSendFormTransactionThunk).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockNavigationDispatch).toHaveBeenCalledTimes(1);
    });

    it('redirects an active review after whole-flow cancellation is confirmed', async () => {
        const action: NavigationAction = { type: 'POP_TO_TOP' };
        mockedUseShowReviewCancellationAlert.mockReturnValue(
            jest.fn().mockResolvedValue({ wasReviewCanceled: true }),
        );
        renderUseEarnReviewBackNavigation(true);

        await act(async () => {
            getInterceptorProps()?.onInterceptedAction?.(action);
            await Promise.resolve();
        });

        expect(cancelSignSendFormTransactionThunk).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockNavigationDispatch).toHaveBeenCalledTimes(1);
        expect(mockNavigationDispatch).not.toHaveBeenCalledWith(action);
    });

    it('cleans up non-intercepted navigation actions', () => {
        renderUseEarnReviewBackNavigation(true);

        getInterceptorProps()?.onPassThroughAction?.({ type: 'REPLACE' });

        expect(cancelSignSendFormTransactionThunk).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
});
