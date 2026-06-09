import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { getInitializedTradingState } from '@suite-native/trading-fixtures';

import { useReceiveAmountMultiplier } from '../useReceiveAmountMultiplier';

const getPreloadedState = (maxSlippagePercentage = '1') => ({
    wallet: {
        trading: {
            ...getInitializedTradingState(),
            settings: { maxSlippagePercentage },
        },
    },
});

const renderUseReceiveAmountMultiplier = (maxSlippagePercentage?: string) =>
    renderHookWithStoreProvider(() => useReceiveAmountMultiplier(), {
        preloadedState: getPreloadedState(maxSlippagePercentage),
    });

describe('useReceiveAmountMultiplier', () => {
    it.each([
        [undefined, '0.99'],
        ['0', '1'],
        ['5', '0.95'],
    ])(
        'applies slippage multiplier for maxSlippagePercentage=%s',
        (maxSlippagePercentage, expectedAmount) => {
            const { result } = renderUseReceiveAmountMultiplier(maxSlippagePercentage);

            expect(result.current('1')).toBe(expectedAmount);
        },
    );
});
