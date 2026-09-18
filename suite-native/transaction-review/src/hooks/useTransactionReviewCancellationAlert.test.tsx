import { type CancelSignSendFormTransactionThunkState } from '@suite-common/wallet-core';
import {
    createStoreFromPreloadedState,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';

import { useTransactionReviewCancellationAlert } from './useTransactionReviewCancellationAlert';

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

describe('useTransactionReviewCancellationAlert', () => {
    let store: ReturnType<typeof createStoreFromPreloadedState>;

    const renderAlert = async () =>
        await renderHookWithStoreProvider(() => useTransactionReviewCancellationAlert(), {
            services: { store },
        });

    beforeEach(() => {
        mockShowAlert.mockClear();
        const state: CancelSignSendFormTransactionThunkState = {
            wallet: { send: { drafts: {} } },
        };
        store = createStoreFromPreloadedState(state);
    });

    it('should return a stable show callback', async () => {
        const { result, rerender } = await renderAlert();

        const firstShow = result.current.show;

        await rerender({});

        expect(result.current.show).toBe(firstShow);
    });

    it('should show the alert when show is called', async () => {
        const { result } = await renderAlert();

        result.current.show();

        expect(mockShowAlert).toHaveBeenCalledTimes(1);
    });

    it('should cancel the signing and resolve with wasReviewCanceled true on the primary button', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderAlert();

        const promise = result.current.show();
        const alertConfig = mockShowAlert.mock.calls[0][0];

        alertConfig.onPressPrimaryButton();

        await expect(promise).resolves.toEqual({ wasReviewCanceled: true });
        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'mockedCancelSignSendFormTransactionThunk' }),
        );
    });

    it('should resolve with wasReviewCanceled false on the secondary button', async () => {
        const dispatchSpy = jest.spyOn(store, 'dispatch');
        const { result } = await renderAlert();

        const promise = result.current.show();
        const alertConfig = mockShowAlert.mock.calls[0][0];

        alertConfig.onPressSecondaryButton();

        await expect(promise).resolves.toEqual({ wasReviewCanceled: false });
        expect(dispatchSpy).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: 'mockedCancelSignSendFormTransactionThunk' }),
        );
    });
});
