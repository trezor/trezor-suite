import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import { getBuyTrade } from '../../__fixtures__/trades';
import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { useChangeStringsExtractor } from '../useChangeStringsExtractor';

describe('useChangeStringsExtractor', () => {
    it('should extract strings for trade', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const { result } = await renderHookWithStoreProviderAsync(
            () => useChangeStringsExtractor(buyTrade),
            { preloadedState: { wallet: { tradingNew: getInitializedTradingState() } } },
        );

        expect(result.current).toEqual({
            fromCryptoId: 'USD',
            fromStringValue: '1234 USD',
            toCryptoId: 'ethereum',
            toStringValue: '0.462586 ETH',
            fromValue: '1234',
            fromSymbol: 'USD',
            toValue: '0.462586',
            toSymbol: 'ETH',
        });
    });
});
