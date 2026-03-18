import type { CryptoId } from 'invity-api';

import { renderHookWithStoreProvider } from '@suite-native/test-utils';
import { getInitializedTradingState } from '@suite-native/trading-fixtures';

import { useSymbolExtractor } from '../useSymbolExtractor';

describe('useSymbolExtractor', () => {
    it('should return symbol for known cryptoId', () => {
        const { result } = renderHookWithStoreProvider(
            () => useSymbolExtractor('bitcoin' as CryptoId),
            { preloadedState: { wallet: { trading: getInitializedTradingState() } } },
        );

        expect(result.current).toBe('BTC');
    });

    it('should return original cryptoId for unknown cryptoId', () => {
        const { result } = renderHookWithStoreProvider(
            () => useSymbolExtractor('unknown-crypto' as CryptoId),
            { preloadedState: { wallet: { trading: getInitializedTradingState() } } },
        );

        expect(result.current).toBe('unknown-crypto');
    });

    it('should handle undefined cryptoId', () => {
        const { result } = renderHookWithStoreProvider(() => useSymbolExtractor(undefined), {
            preloadedState: { wallet: { trading: getInitializedTradingState() } },
        });

        expect(result.current).toBeUndefined();
    });
});
