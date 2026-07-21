import { sendFormActions } from '@suite-common/wallet-core';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';
import { useShowReviewCancellationAlert } from '@suite-native/transaction-management';

import { useHandleOnDeviceTransactionReview } from '../useHandleOnDeviceTransactionReview';

const mockDispatch = jest.fn();
const mockShowReviewCancellationAlert = jest.fn();
let mockIsTransactionReviewInProgress = false;

jest.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: () => mockIsTransactionReviewInProgress,
}));

jest.mock('@suite-common/wallet-core', () => ({
    sendFormActions: {
        discardTransaction: jest.fn(() => ({ type: 'discard-transaction' })),
    },
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: jest.fn(),
    }),
}));

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({ showAlert: jest.fn() }),
}));

jest.mock('@suite-native/navigation', () => ({
    RootStackRoutes: { AccountDetail: 'AccountDetail' },
    useNavigationRemoveActionInterceptor: jest.fn(),
}));

jest.mock('@suite-native/send', () => ({
    signTransactionNativeThunk: jest.fn(),
}));

jest.mock('@suite-native/transaction-management', () => ({
    selectIsTransactionReviewInProgress: jest.fn(),
    useShowReviewCancellationAlert: jest.fn(),
}));

jest.mock('../useHandleCommonSignRejection', () => ({
    useHandleCommonSignRejection: () => jest.fn(),
}));

const mockedUseNavigationRemoveActionInterceptor = jest.mocked(
    useNavigationRemoveActionInterceptor,
);
const mockedUseShowReviewCancellationAlert = jest.mocked(useShowReviewCancellationAlert);

const getInterceptorProps = () => mockedUseNavigationRemoveActionInterceptor.mock.calls.at(-1)?.[0];

const renderUseHandleOnDeviceTransactionReview = () =>
    renderHookWithBasicProvider(() =>
        useHandleOnDeviceTransactionReview({
            accountKey: mockAccountKey(),
            transaction: null,
        }),
    );

describe('useHandleOnDeviceTransactionReview', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsTransactionReviewInProgress = false;
        mockedUseShowReviewCancellationAlert.mockReturnValue(mockShowReviewCancellationAlert);
    });

    it('passes through back navigation and discards inactive review state', () => {
        renderUseHandleOnDeviceTransactionReview();

        getInterceptorProps()?.onPassThroughAction?.({ type: 'GO_BACK' });

        expect(getInterceptorProps()?.actionTypesToIntercept).toEqual([]);
        expect(mockDispatch).toHaveBeenCalledWith(sendFormActions.discardTransaction());
    });

    it.each(['GO_BACK', 'POP'] as const)(
        'intercepts %s navigation while transaction review is in progress',
        actionType => {
            mockIsTransactionReviewInProgress = true;
            renderUseHandleOnDeviceTransactionReview();

            getInterceptorProps()?.onInterceptedAction?.({ type: actionType });

            expect(getInterceptorProps()?.actionTypesToIntercept).toEqual(['GO_BACK', 'POP']);
            expect(mockShowReviewCancellationAlert).toHaveBeenCalledTimes(1);
            expect(mockDispatch).not.toHaveBeenCalled();
        },
    );

    it('discards review state for non-intercepted navigation actions', () => {
        mockIsTransactionReviewInProgress = true;
        renderUseHandleOnDeviceTransactionReview();

        getInterceptorProps()?.onPassThroughAction?.({ type: 'POP_TO_TOP' });

        expect(mockDispatch).toHaveBeenCalledWith(sendFormActions.discardTransaction());
    });
});
