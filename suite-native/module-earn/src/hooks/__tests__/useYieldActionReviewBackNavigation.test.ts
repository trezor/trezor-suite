import { type NavigationAction } from '@react-navigation/native';

import { stablecoinYieldActions } from '@suite-common/wallet-core';
import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import TrezorConnect from '@trezor/connect';

import { useShowYieldReviewCancellationAlert } from '../useShowYieldReviewCancellationAlert';
import { useYieldActionReviewBackNavigation } from '../useYieldActionReviewBackNavigation';

const mockDispatch = jest.fn();
const mockNavigationDispatch = jest.fn();

jest.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: jest.fn(),
}));

jest.mock('@suite-common/wallet-core', () => ({
    stablecoinYieldActions: {
        discardTransaction: jest.fn(() => ({ type: 'discard-yield-transaction' })),
    },
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        dispatch: mockNavigationDispatch,
        goBack: jest.fn(),
    }),
}));

jest.mock('@suite-native/navigation', () => ({
    useNavigationRemoveActionInterceptor: jest.fn(),
}));

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: {
        cancel: jest.fn(),
    },
}));

jest.mock('../useShowYieldReviewCancellationAlert', () => ({
    useShowYieldReviewCancellationAlert: jest.fn(),
}));

const mockedUseNavigationRemoveActionInterceptor = jest.mocked(
    useNavigationRemoveActionInterceptor,
);
const mockedUseShowYieldReviewCancellationAlert = jest.mocked(useShowYieldReviewCancellationAlert);

const getInterceptorProps = () => mockedUseNavigationRemoveActionInterceptor.mock.calls.at(-1)?.[0];

describe('useYieldActionReviewBackNavigation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('discards a review when navigation passes through', () => {
        const onReviewLeave = jest.fn();
        renderHookWithBasicProvider(() =>
            useYieldActionReviewBackNavigation({
                onReviewLeave,
                reviewStatus: 'idle',
            }),
        );

        getInterceptorProps()?.onPassThroughAction?.({ type: 'GO_BACK' });

        expect(getInterceptorProps()?.actionTypesToIntercept).toEqual([]);
        expect(onReviewLeave).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith(stablecoinYieldActions.discardTransaction());
    });

    it.each(['GO_BACK', 'POP'] as const)(
        'cancels signing and resumes an intercepted %s action after confirmation',
        async actionType => {
            const onReviewLeave = jest.fn();
            const action: NavigationAction = { type: actionType };
            mockedUseShowYieldReviewCancellationAlert.mockReturnValue(
                jest.fn().mockResolvedValue({ wasReviewCanceled: true }),
            );
            renderHookWithBasicProvider(() =>
                useYieldActionReviewBackNavigation({
                    onReviewLeave,
                    reviewStatus: 'signing',
                }),
            );

            await act(async () => {
                getInterceptorProps()?.onInterceptedAction?.(action);
                await Promise.resolve();
            });

            expect(getInterceptorProps()?.actionTypesToIntercept).toEqual(['GO_BACK', 'POP']);
            expect(TrezorConnect.cancel).toHaveBeenCalledWith({ reason: 'tx-cancelled' });
            expect(onReviewLeave).toHaveBeenCalledTimes(1);
            expect(mockDispatch).toHaveBeenCalledWith(stablecoinYieldActions.discardTransaction());
            expect(mockNavigationDispatch).toHaveBeenCalledWith(action);
        },
    );

    it.each(['GO_BACK', 'POP'] as const)(
        'keeps the %s action intercepted when cancellation is declined',
        async actionType => {
            mockedUseShowYieldReviewCancellationAlert.mockReturnValue(
                jest.fn().mockResolvedValue({ wasReviewCanceled: false }),
            );
            renderHookWithBasicProvider(() =>
                useYieldActionReviewBackNavigation({ reviewStatus: 'sending' }),
            );

            await act(async () => {
                getInterceptorProps()?.onInterceptedAction?.({ type: actionType });
                await Promise.resolve();
            });

            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockNavigationDispatch).not.toHaveBeenCalled();
        },
    );

    it('discards an active review for a non-intercepted removal action', () => {
        const onReviewLeave = jest.fn();
        renderHookWithBasicProvider(() =>
            useYieldActionReviewBackNavigation({
                onReviewLeave,
                reviewStatus: 'signing',
            }),
        );

        getInterceptorProps()?.onPassThroughAction?.({ type: 'POP_TO_TOP' });

        expect(onReviewLeave).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith(stablecoinYieldActions.discardTransaction());
    });
});
