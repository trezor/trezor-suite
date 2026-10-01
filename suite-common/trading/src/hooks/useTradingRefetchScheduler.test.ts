import { act } from 'react';

import { useTradingRefetchScheduler } from './useTradingRefetchScheduler';
import { tradingActions } from '../reducers/tradingCommonReducer';
import { renderHookWithTradingStore } from '../test-utils/testUtils';

describe('useTradingRefetchScheduler', () => {
    it('should verify that timestapp is set and cleared on unmount', () => {
        const { result, unmount, services } = renderHookWithTradingStore(() =>
            useTradingRefetchScheduler({
                onRefetch: jest.fn(),
            }),
        );
        expect(
            services.store.getState().wallet.trading.quoteRefetchingState.lastFetchTimestamp,
        ).toBeUndefined();

        act(() => {
            services.store.dispatch(tradingActions.setRefetchQuotesTimestamp(Date.now()));
        });
        expect(
            services.store.getState().wallet.trading.quoteRefetchingState.lastFetchTimestamp,
        ).toBeDefined();
        expect(result.current).toBeUndefined();

        unmount();

        expect(
            services.store.getState().wallet.trading.quoteRefetchingState.lastFetchTimestamp,
        ).toBeUndefined();
    });

    it('should call onRefetch after specified time', () => {
        jest.useFakeTimers();
        const mockOnRefetch = jest.fn();
        const { services } = renderHookWithTradingStore(() =>
            useTradingRefetchScheduler({
                onRefetch: mockOnRefetch,
            }),
        );

        act(() => {
            services.store.dispatch(tradingActions.setRefetchQuotesTimestamp(Date.now()));
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
