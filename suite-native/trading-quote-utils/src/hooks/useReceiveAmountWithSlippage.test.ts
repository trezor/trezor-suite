import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { getInitializedTradingState, mercuryoDexQuote } from '@suite-native/trading-fixtures';

import { useReceiveAmountWithSlippage } from './useReceiveAmountWithSlippage';

const getPreloadedState = (swapSlippage: string | undefined) => {
    const trading = getInitializedTradingState();
    trading.exchange.selectedQuote = { ...mercuryoDexQuote, swapSlippage };

    return { wallet: { trading } };
};

const renderUseReceiveAmountWithSlippage = (swapSlippage: string | undefined) =>
    renderHookWithStoreProvider(() => useReceiveAmountWithSlippage(), {
        preloadedState: getPreloadedState(swapSlippage),
    });

describe('useReceiveAmountWithSlippage', () => {
    it.each([
        [undefined, '0.99'],
        ['0', '1'],
        ['5', '0.95'],
    ])(
        'applies slippage multiplier for selected quote swapSlippage=%s',
        async (swapSlippage, expectedAmount) => {
            const { result } = await renderUseReceiveAmountWithSlippage(swapSlippage);

            expect(result.current('1')).toBe(expectedAmount);
        },
    );
});
