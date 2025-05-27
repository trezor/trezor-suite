import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import { getBuyTrade } from '../../../__fixtures__/trades';
import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useChangeStringsExtractor } from '../useChangeStringsExtractor';

describe('useChangeStringsExtractor', () => {
    it('should extract strings for trade', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const { result } = await renderHookWithStoreProviderAsync(
            () => useChangeStringsExtractor(buyTrade.data),
            { preloadedState: { wallet: { tradingNew: getInitializedTradingState() } } },
        );

        expect(result.current).toEqual({
            fromCurrency: 'USD',
            fromStringValue: '$1,234.00',
            toCurrency: 'ethereum',
            toStringValue: '0.462586 ETH',
            fromValue: '1234',
            toValue: '0.462586',
            isFromCrypto: false,
            isToCrypto: true,
        });
    });
});
