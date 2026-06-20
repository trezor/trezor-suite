import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { getInitializedTradingState, mercuryoDexQuote } from '@suite-native/trading-fixtures';

import { useReceiveAmountMultiplier } from '../useReceiveAmountMultiplier';

const getPreloadedState = (swapSlippage: string | undefined) => {
    const trading = getInitializedTradingState();
    trading.exchange.selectedQuote = { ...mercuryoDexQuote, swapSlippage };

    return { wallet: { trading } };
};

const renderUseReceiveAmountMultiplier = (swapSlippage: string | undefined) =>
    renderHookWithStoreProvider(() => useReceiveAmountMultiplier(), {
        preloadedState: getPreloadedState(swapSlippage),
    });

describe('useReceiveAmountMultiplier', () => {
    it.each([
        [undefined, '0.99'],
        ['0', '1'],
        ['5', '0.95'],
    ])(
        'applies slippage multiplier for selected quote swapSlippage=%s',
        (swapSlippage, expectedAmount) => {
            const { result } = renderUseReceiveAmountMultiplier(swapSlippage);

            expect(result.current('1')).toBe(expectedAmount);
        },
    );
});
