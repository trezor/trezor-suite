import { combineReducers } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { initialWalletSettingsState, sendFormActions } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import {
    selectTradingProviderConfirmationStatus,
    tradingActions,
    tradingSlice,
} from '@suite-native/trading-state';
import { prepareSendFormReducer } from '@suite-native/transaction-management';

import { useProviderConfirmationStatus } from './useProviderConfirmationStatus';

describe('useProviderConfirmationStatus', () => {
    let store: TestStore;

    const renderUseProviderConfirmationStatus = async () =>
        await renderHookWithStoreProvider(() => useProviderConfirmationStatus(), {
            store,
        });

    beforeEach(() => {
        store = createLightStore({
            reducer: {
                locale: localeReducer,
                wallet: combineReducers({
                    settings: createStaticReducer(initialWalletSettingsState),
                    send: prepareSendFormReducer(extraDependenciesCommonMock),
                    trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
                }),
            },
        });
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

        await unmount();

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('inactive');
    });

    it('should set tradingProviderConfirmationStatus to "confirmation_failed" after 30 "window_closed_incomplete" is set', async () => {
        await renderUseProviderConfirmationStatus();
        jest.useFakeTimers();

        await act(() => {
            store.dispatch(tradingActions.setProviderConfirmationStatus('window_opened'));
            store.dispatch(
                tradingActions.setProviderConfirmationStatus('window_closed_incomplete'),
            );
        });

        await act(() => {
            jest.advanceTimersByTime(30_000);
        });

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
            'confirmation_failed',
        );
    });

    it('should set tradingProviderConfirmationStatus to "confirmation_failed" after 30 "window_closed_with_success" is set', async () => {
        await renderUseProviderConfirmationStatus();
        jest.useFakeTimers();

        await act(() => {
            store.dispatch(tradingActions.setProviderConfirmationStatus('window_opened'));
            store.dispatch(
                tradingActions.setProviderConfirmationStatus('window_closed_with_success'),
            );
        });

        await act(() => {
            jest.advanceTimersByTime(30_000);
        });

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
            'confirmation_failed',
        );
    });

    it('should not set tradingProviderConfirmationStatus to "confirmation_failed" when status changes', async () => {
        await renderUseProviderConfirmationStatus();
        jest.useFakeTimers();

        await act(() => {
            store.dispatch(tradingActions.setProviderConfirmationStatus('window_opened'));
            store.dispatch(
                tradingActions.setProviderConfirmationStatus('window_closed_with_success'),
            );
        });

        await act(() => {
            jest.advanceTimersByTime(15_000);
        });

        await act(() => {
            store.dispatch(tradingActions.setProviderConfirmationStatus('confirmation_success'));
        });

        await act(() => {
            jest.advanceTimersByTime(30_000);
        });

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
            'confirmation_success',
        );
    });

    it('should set tradingProviderConfirmationStatus to "confirmation_success" when isTradeFinalized becomes truthy', async () => {
        await renderUseProviderConfirmationStatus();

        await act(() => {
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

    it('should wait for the browser to close before setting "confirmation_success"', async () => {
        await renderUseProviderConfirmationStatus();

        await act(() => {
            store.dispatch(tradingActions.setProviderConfirmationStatus('window_opened'));
            store.dispatch(
                sendFormActions.storePrecomposedTransaction({
                    precomposedTransaction: { type: 'final' },
                } as any),
            );
        });

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');

        await act(() => {
            store.dispatch(
                tradingActions.setProviderConfirmationStatus('window_closed_incomplete'),
            );
        });

        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
            'confirmation_success',
        );
    });
});
