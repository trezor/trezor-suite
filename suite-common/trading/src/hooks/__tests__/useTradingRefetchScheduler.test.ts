import { act } from 'react';

import { renderHookWithTradingStore } from '../../__tests__/testUtils';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import { useTradingRefetchScheduler } from '../useTradingRefetchScheduler';

describe('useTradingRefetchScheduler', () => {
    it('should verify that timestapp is set and cleared on unmount', () => {
        const { result, unmount, store } = renderHookWithTradingStore(() =>
            useTradingRefetchScheduler({
                onRefetch: jest.fn(),
            }),
        );
        expect(
            store.getState().wallet.trading.quoteRefetchingState.lastFetchTimestamp,
        ).toBeUndefined();

        act(() => {
            store.dispatch(tradingActions.setRefetchQuotesTimestamp(Date.now()));
        });
        expect(
            store.getState().wallet.trading.quoteRefetchingState.lastFetchTimestamp,
        ).toBeDefined();
        expect(result.current).toBeUndefined();

        unmount();

        expect(
            store.getState().wallet.trading.quoteRefetchingState.lastFetchTimestamp,
        ).toBeUndefined();
    });

    it('should call onRefetch after specified time', () => {
        jest.useFakeTimers();
        const mockOnRefetch = jest.fn();
        const { store } = renderHookWithTradingStore(() =>
            useTradingRefetchScheduler({
                onRefetch: mockOnRefetch,
            }),
        );

        act(() => {
            store.dispatch(tradingActions.setRefetchQuotesTimestamp(Date.now()));
        });

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockOnRefetch).toHaveBeenCalledTimes(0);

        act(() => {
            jest.advanceTimersByTime(30000);
        });

        expect(mockOnRefetch).toHaveBeenCalledTimes(1);
    });
});
