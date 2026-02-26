import type { CryptoId } from 'invity-api';

// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { getInitializedTradingState } from '@suite-native/trading-fixtures';

import { useSymbolExtractor } from '../useSymbolExtractor';

describe('useSymbolExtractor', () => {
    it('should return symbol for known cryptoId', async () => {
        const { result } = await renderHookWithStoreProviderAsync(
            () => useSymbolExtractor('bitcoin' as CryptoId),
            { preloadedState: { wallet: { trading: getInitializedTradingState() } } },
        );

        expect(result.current).toBe('BTC');
    });

    it('should return original cryptoId for unknown cryptoId', async () => {
        const { result } = await renderHookWithStoreProviderAsync(
            () => useSymbolExtractor('unknown-crypto' as CryptoId),
            { preloadedState: { wallet: { trading: getInitializedTradingState() } } },
        );

        expect(result.current).toBe('unknown-crypto');
    });

    it('should handle undefined cryptoId', async () => {
        const { result } = await renderHookWithStoreProviderAsync(
            () => useSymbolExtractor(undefined),
            { preloadedState: { wallet: { trading: getInitializedTradingState() } } },
        );

        expect(result.current).toBeUndefined();
    });
});
