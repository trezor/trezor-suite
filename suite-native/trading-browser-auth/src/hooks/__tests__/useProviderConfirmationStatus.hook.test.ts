import { sendFormActions } from '@suite-common/wallet-core';
import {
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import {
    selectTradingProviderConfirmationStatus,
    tradingActions,
} from '@suite-native/trading-state';

import { useProviderConfirmationStatus } from '../useProviderConfirmationStatus';

describe('useProviderConfirmationStatus', () => {
    let store: TestStore;

    const renderUseProviderConfirmationStatus = () =>
        renderHookWithStoreProviderAsync(() => useProviderConfirmationStatus(), {
            store,
        });

    beforeEach(async () => {
        ({ store } = await initStore());
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return current status', async () => {
        store.dispatch(tradingActions.setProviderConfirmationStatus('window_opened'));
        const { result } = await renderUseProviderConfirmationStatus();

        expect(result.current).toEqual('window_opened');
    });

    it('should clear tradingProviderConfirmationStatus on unmount', async () => {
        store.dispatch(tradingActions.setProviderConfirmationStatus('window_opened'));
        const { unmount } = await renderUseProviderConfirmationStatus();

        unmount();

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('inactive');
    });

    it('should set tradingProviderConfirmationStatus to "confirmation_failed" after 30 "window_closed_incomplete" is set', async () => {
        await renderUseProviderConfirmationStatus();
        jest.useFakeTimers();

        act(() => {
            store.dispatch(tradingActions.setProviderConfirmationStatus('window_opened'));
            store.dispatch(
                tradingActions.setProviderConfirmationStatus('window_closed_incomplete'),
            );
        });

        act(() => {
            jest.advanceTimersByTime(30_000);
        });

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
            'confirmation_failed',
        );
    });

    it('should set tradingProviderConfirmationStatus to "confirmation_failed" after 30 "window_closed_with_success" is set', async () => {
        await renderUseProviderConfirmationStatus();
        jest.useFakeTimers();

        act(() => {
            store.dispatch(tradingActions.setProviderConfirmationStatus('window_opened'));
            store.dispatch(
                tradingActions.setProviderConfirmationStatus('window_closed_with_success'),
            );
        });

        act(() => {
            jest.advanceTimersByTime(30_000);
        });

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
            'confirmation_failed',
        );
    });

    it('should not set tradingProviderConfirmationStatus to "confirmation_failed" when status changes', async () => {
        await renderUseProviderConfirmationStatus();
        jest.useFakeTimers();

        act(() => {
            store.dispatch(tradingActions.setProviderConfirmationStatus('window_opened'));
            store.dispatch(
                tradingActions.setProviderConfirmationStatus('window_closed_with_success'),
            );
        });

        act(() => {
            jest.advanceTimersByTime(15_000);
        });

        act(() => {
            store.dispatch(tradingActions.setProviderConfirmationStatus('confirmation_success'));
        });

        act(() => {
            jest.advanceTimersByTime(30_000);
        });

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
            'confirmation_success',
        );
    });

    it('should set tradingProviderConfirmationStatus to "confirmation_success" when isTradeFinalized becomes truthy', async () => {
        await renderUseProviderConfirmationStatus();

        act(() => {
            store.dispatch(tradingActions.setProviderConfirmationStatus('window_opened'));
            store.dispatch(
                tradingActions.setProviderConfirmationStatus('window_closed_with_success'),
            );
            store.dispatch(
                sendFormActions.storePrecomposedTransaction({
                    precomposedTransaction: { type: 'final' },
                } as any),
            );
        });

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
            'confirmation_success',
        );
    });
});
