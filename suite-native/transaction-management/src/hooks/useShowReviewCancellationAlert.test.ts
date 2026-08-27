import {
    type TestStore,
    createStoreFromPreloadedState,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';

import { useShowReviewCancellationAlert } from './useShowReviewCancellationAlert';

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

    const renderUseShowReviewCancellationAlert = async () =>
        await renderHookWithStoreProvider(() => useShowReviewCancellationAlert(), { store });

    beforeEach(() => {
        mockShowAlert.mockClear();
        store = createStoreFromPreloadedState();
    });

    it('should return stable callback', async () => {
        const { result, rerender } = await renderUseShowReviewCancellationAlert();

        const firstCallback = result.current;

        await rerender({});

        const secondCallback = result.current;

        expect(firstCallback).toBe(secondCallback);
    });

    it('should call showAlert on callback execution', async () => {
        const { result } = await renderUseShowReviewCancellationAlert();

        result.current();

        expect(mockShowAlert).toHaveBeenCalledTimes(1);
    });

    it('should resolve with wasReviewCanceled true when primary button is pressed', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderUseShowReviewCancellationAlert();
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
        const { result } = await renderUseShowReviewCancellationAlert();
        const promise = result.current();
        const alertConfig = mockShowAlert.mock.calls[0][0];

        alertConfig.onPressSecondaryButton();
        const resolution = await promise;

        expect(resolution).toEqual({ wasReviewCanceled: false });
    });
});
