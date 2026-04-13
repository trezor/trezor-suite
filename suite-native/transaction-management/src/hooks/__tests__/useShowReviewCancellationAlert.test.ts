import {
    type TestStore,
    initStore,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';

import { useShowReviewCancellationAlert } from '../useShowReviewCancellationAlert';

const mockShowAlert = jest.fn();

jest.mock('@suite-native/alerts', () => ({
    useAlert: () => ({
        showAlert: mockShowAlert,
    }),
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    cancelSignSendFormTransactionThunk: () => ({
        type: 'mockedCancelSignSendFormTransactionThunk',
    }),
}));

describe('useShowReviewCancellationAlert', () => {
    let store: TestStore;

    const renderUseShowReviewCancellationAlert = () =>
        renderHookWithStoreProvider(() => useShowReviewCancellationAlert(), { store });

    beforeEach(() => {
        mockShowAlert.mockClear();
        store = initStore().store;
    });

    it('should return stable callback', () => {
        const { result, rerender } = renderUseShowReviewCancellationAlert();

        const firstCallback = result.current;

        rerender({});

        const secondCallback = result.current;

        expect(firstCallback).toBe(secondCallback);
    });

    it('should call showAlert on callback execution', () => {
        const { result } = renderUseShowReviewCancellationAlert();

        result.current();

        expect(mockShowAlert).toHaveBeenCalledTimes(1);
    });

    it('should resolve with wasReviewCanceled true when primary button is pressed', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch').mockReturnValue({} as any);
        const { result } = renderUseShowReviewCancellationAlert();
        const promise = result.current();
        const alertConfig = mockShowAlert.mock.calls[0][0];

        alertConfig.onPressPrimaryButton();
        const resolution = await promise;

        expect(resolution).toEqual({ wasReviewCanceled: true });
        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'mockedCancelSignSendFormTransactionThunk' }),
        );
    });

    it('should resolve with wasReviewCanceled false when secondary button is pressed', async () => {
        const { result } = renderUseShowReviewCancellationAlert();
        const promise = result.current();
        const alertConfig = mockShowAlert.mock.calls[0][0];

        alertConfig.onPressSecondaryButton();
        const resolution = await promise;

        expect(resolution).toEqual({ wasReviewCanceled: false });
    });
});
