import { CryptoId } from 'invity-api';

import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import { getInitializedTradingState } from '../../__fixtures__/tradingState';
import { useSymbolExtractor } from '../useSymbolExtractor';

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
