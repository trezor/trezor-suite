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

    it('clears trading state on unmount', async () => {
        const { unmount } = await renderHookWithTradingProvider(
            () => useClearTradingStateOnUnmount(),
            {
                tradeType: 'sell',
            },
        );

        expect(mockClearTradingStateThunk).not.toHaveBeenCalled();

        await unmount();

        expect(mockClearTradingStateThunk).toHaveBeenCalledTimes(1);
    });
});
