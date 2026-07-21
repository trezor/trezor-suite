import { type NavigationAction } from '@react-navigation/native';

import { sendFormActions } from '@suite-common/wallet-core';
import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useShowYieldReviewCancellationAlert } from '../useShowYieldReviewCancellationAlert';
import { useYieldApprovalReviewNavigation } from '../useYieldApprovalReviewNavigation';

const mockDispatch = jest.fn();
const mockNavigationDispatch = jest.fn();
const mockGoBack = jest.fn();

jest.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: jest.fn(),
}));

jest.mock('@suite-common/wallet-core', () => ({
    cancelSignSendFormTransactionThunk: jest.fn(() => ({ type: 'cancel-sign' })),
    handleYieldApproveCancelThunk: jest.fn(() => ({ type: 'cancel-approval' })),
    sendFormActions: {
        discardTransaction: jest.fn(() => ({ type: 'discard-transaction' })),
    },
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        dispatch: mockNavigationDispatch,
        goBack: mockGoBack,
    }),
}));

jest.mock('@suite-native/navigation', () => ({
    useDisableIOSGesture: jest.fn(),
    useNavigationRemoveActionInterceptor: jest.fn(),
}));

jest.mock('../useShowYieldReviewCancellationAlert', () => ({
    useShowYieldReviewCancellationAlert: jest.fn(),
}));

const mockedUseNavigationRemoveActionInterceptor = jest.mocked(
    useNavigationRemoveActionInterceptor,
);
const mockedUseShowYieldReviewCancellationAlert = jest.mocked(useShowYieldReviewCancellationAlert);

const getInterceptorProps = () => mockedUseNavigationRemoveActionInterceptor.mock.calls.at(-1)?.[0];

const renderUseYieldApprovalReviewNavigation = ({
    shouldConfirmCancellation = true,
    onReviewLeave = jest.fn(),
}: {
    shouldConfirmCancellation?: boolean;
    onReviewLeave?: () => void;
} = {}) =>
    renderHookWithBasicProvider(() =>
        useYieldApprovalReviewNavigation({
            flowKey: 'flow-key',
            onReviewLeave,
            shouldConfirmCancellation,
            transactionType: 'revoke',
        }),
    );

describe('useYieldApprovalReviewNavigation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('cleans up a review when navigation passes through', () => {
        const onReviewLeave = jest.fn();
        renderUseYieldApprovalReviewNavigation({
            shouldConfirmCancellation: false,
            onReviewLeave,
        });

        getInterceptorProps()?.onPassThroughAction?.({ type: 'GO_BACK' });

        expect(getInterceptorProps()?.actionTypesToIntercept).toEqual([]);
        expect(onReviewLeave).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith(sendFormActions.discardTransaction());
    });

    it.each(['GO_BACK', 'POP'] as const)(
        'resumes an intercepted %s action after cancellation is confirmed',
        async actionType => {
            const onReviewLeave = jest.fn();
            const action: NavigationAction = { type: actionType };
            mockedUseShowYieldReviewCancellationAlert.mockReturnValue(
                jest.fn().mockResolvedValue({ wasReviewCanceled: true }),
            );
            renderUseYieldApprovalReviewNavigation({ onReviewLeave });

            await act(async () => {
                getInterceptorProps()?.onInterceptedAction?.(action);
                await Promise.resolve();
            });

            expect(getInterceptorProps()?.actionTypesToIntercept).toEqual(['GO_BACK', 'POP']);
            expect(onReviewLeave).toHaveBeenCalledTimes(1);
            expect(mockDispatch).toHaveBeenCalledTimes(1);
            expect(mockNavigationDispatch).toHaveBeenCalledWith(action);
        },
    );

    it.each(['GO_BACK', 'POP'] as const)(
        'keeps the %s action intercepted when cancellation is declined',
        async actionType => {
            const onReviewLeave = jest.fn();
            mockedUseShowYieldReviewCancellationAlert.mockReturnValue(
                jest.fn().mockResolvedValue({ wasReviewCanceled: false }),
            );
            renderUseYieldApprovalReviewNavigation({ onReviewLeave });

            await act(async () => {
                getInterceptorProps()?.onInterceptedAction?.({ type: actionType });
                await Promise.resolve();
            });

            expect(onReviewLeave).not.toHaveBeenCalled();
            expect(mockDispatch).not.toHaveBeenCalled();
            expect(mockNavigationDispatch).not.toHaveBeenCalled();
        },
    );

    it('cleans up an active review for a non-intercepted removal action', () => {
        const onReviewLeave = jest.fn();
        renderUseYieldApprovalReviewNavigation({ onReviewLeave });

        getInterceptorProps()?.onPassThroughAction?.({ type: 'POP_TO_TOP' });

        expect(onReviewLeave).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith(sendFormActions.discardTransaction());
    });
});
