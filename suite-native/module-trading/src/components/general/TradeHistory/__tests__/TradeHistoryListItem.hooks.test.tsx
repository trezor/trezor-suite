import { CryptoId } from 'invity-api';

import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import { getBuyTrade } from '../../../../__fixtures__/trades';
import { getInitializedTradingState } from '../../../../__fixtures__/tradingState';
import { useChangeStringsExtractor, useSymbolExtractor } from '../TradeHistoryListItem';

describe('TradeHistoryListItem hooks', () => {
    describe('useSymbolExtractor', () => {
        it('should return symbol for known cryptoId', async () => {
            const { result } = await renderHookWithStoreProviderAsync(
                () => useSymbolExtractor('bitcoin' as CryptoId),
                { preloadedState: { wallet: { tradingNew: getInitializedTradingState() } } },
            );

            expect(result.current).toBe('BTC');
        });

        it('should return original cryptoId for unknown cryptoId', async () => {
            const { result } = await renderHookWithStoreProviderAsync(
                () => useSymbolExtractor('unknown-crypto' as CryptoId),
                { preloadedState: { wallet: { tradingNew: getInitializedTradingState() } } },
            );

            expect(result.current).toBe('unknown-crypto');
        });

        it('should handle undefined cryptoId', async () => {
            const { result } = await renderHookWithStoreProviderAsync(
                () => useSymbolExtractor(undefined),
                { preloadedState: { wallet: { tradingNew: getInitializedTradingState() } } },
            );

            expect(result.current).toBeUndefined();
        });
    });

    describe('useChangeStringsExtractor', () => {
        it('should extract strings for trade', async () => {
            const buyTrade = getBuyTrade({});
            const { result } = await renderHookWithStoreProviderAsync(
                () => useChangeStringsExtractor(buyTrade),
                { preloadedState: { wallet: { tradingNew: getInitializedTradingState() } } },
            );

            expect(result.current).toEqual({
                fromStringValue: '1234 USD',
                toStringValue: '0.462586 ETH',
            });
        });
    });
});
