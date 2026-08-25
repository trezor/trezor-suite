import { useClearTradingStateOnUnmount } from './useClearTradingStateOnUnmount';
import { renderHookWithTradingProvider } from '../../test-utils/tradingTestUtils';

const mockClearTradingStateThunk = jest.fn(() => ({ type: 'trading/clear' }));

jest.mock('../../thunks', () => ({
    ...jest.requireActual('../../thunks'),
    clearTradingStateThunk: () => mockClearTradingStateThunk(),
}));

describe('useClearTradingStateOnUnmount', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('clears trading state on unmount', () => {
        const { unmount } = renderHookWithTradingProvider(() => useClearTradingStateOnUnmount(), {
            tradeType: 'sell',
        });

        expect(mockClearTradingStateThunk).not.toHaveBeenCalled();

        unmount();

        expect(mockClearTradingStateThunk).toHaveBeenCalledTimes(1);
    });
});
