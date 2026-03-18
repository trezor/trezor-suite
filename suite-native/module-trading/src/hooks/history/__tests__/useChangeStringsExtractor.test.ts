import { renderHookWithStoreProvider } from '@suite-native/test-utils';
import {
    getBuyTrade,
    getExchangeTrade,
    getInitializedTradingState,
    getSellTrade,
} from '@suite-native/trading-fixtures';

import { useChangeStringsExtractor } from '../useChangeStringsExtractor';

describe('useChangeStringsExtractor', () => {
    it('should extract strings for buy trade', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const { result } = renderHookWithStoreProvider(
            () => useChangeStringsExtractor(buyTrade.data),
            { preloadedState: { wallet: { trading: getInitializedTradingState() } } },
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

    it('should extract strings for sell trade', () => {
        const sellTrade = getSellTrade({ status: 'SUBMITTED' });
        const { result } = renderHookWithStoreProvider(
            () => useChangeStringsExtractor(sellTrade.data),
            { preloadedState: { wallet: { trading: getInitializedTradingState() } } },
        );

        expect(result.current).toEqual({
            fromCurrency: 'bitcoin',
            fromStringValue: '1.22 BTC',
            toCurrency: 'USD',
            toStringValue: '$100.00',
            fromValue: '1.22',
            toValue: '100',
            isFromCrypto: true,
            isToCrypto: false,
        });
    });

    it('should extract strings for exchange trade', () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONFIRM' });
        const { result } = renderHookWithStoreProvider(
            () => useChangeStringsExtractor(exchangeTrade.data),
            { preloadedState: { wallet: { trading: getInitializedTradingState() } } },
        );

        expect(result.current).toEqual({
            fromCurrency: 'solana--jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
            fromStringValue: '10.1232 JTO',
            toCurrency: 'solana',
            toStringValue: '0.462586 SOL',
            fromValue: '10.1232',
            toValue: '0.462586',
            isFromCrypto: true,
            isToCrypto: true,
        });
    });

    it('should handle undefined trade', () => {
        const { result } = renderHookWithStoreProvider(() => useChangeStringsExtractor(undefined), {
            preloadedState: { wallet: { trading: getInitializedTradingState() } },
        });

        expect(result.current).toEqual({
            fromCurrency: undefined,
            fromStringValue: undefined,
            toCurrency: undefined,
            toStringValue: undefined,
            fromValue: undefined,
            toValue: undefined,
            isFromCrypto: undefined,
            isToCrypto: undefined,
        });
    });

    it('should handle trade with missing values', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const tradeWithMissingValues = {
            ...buyTrade.data,
            fiatStringAmount: undefined,
            receiveStringAmount: undefined,
        };

        const { result } = renderHookWithStoreProvider(
            () => useChangeStringsExtractor(tradeWithMissingValues),
            { preloadedState: { wallet: { trading: getInitializedTradingState() } } },
        );

        expect(result.current).toEqual({
            fromCurrency: 'USD',
            fromStringValue: undefined,
            toCurrency: 'ethereum',
            toStringValue: undefined,
            fromValue: undefined,
            toValue: undefined,
            isFromCrypto: false,
            isToCrypto: true,
        });
    });
});
