import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import { getBuyTrade, getExchangeTrade, getSellTrade } from '../../../__fixtures__/trades';
import { getInitializedTradingState } from '../../../__fixtures__/tradingState';
import { useChangeStringsExtractor } from '../useChangeStringsExtractor';

describe('useChangeStringsExtractor', () => {
    it('should extract strings for buy trade', async () => {
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
            formattedRate: '$2,667.61 / 1 ETH',
        });
    });

    it('should extract strings for sell trade', async () => {
        const sellTrade = getSellTrade({ status: 'SUBMITTED' });
        const { result } = await renderHookWithStoreProviderAsync(
            () => useChangeStringsExtractor(sellTrade.data),
            { preloadedState: { wallet: { tradingNew: getInitializedTradingState() } } },
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
            formattedRate: '0.01219999 BTC / $1.00',
        });
    });

    it('should extract strings for exchange trade', async () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONFIRM' });
        const { result } = await renderHookWithStoreProviderAsync(
            () => useChangeStringsExtractor(exchangeTrade.data),
            { preloadedState: { wallet: { tradingNew: getInitializedTradingState() } } },
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
            formattedRate: '21.883930771791626 JTO / 1 SOL',
        });
    });

    it('should handle undefined trade', async () => {
        const { result } = await renderHookWithStoreProviderAsync(
            () => useChangeStringsExtractor(undefined),
            { preloadedState: { wallet: { tradingNew: getInitializedTradingState() } } },
        );

        expect(result.current).toEqual({
            fromCurrency: undefined,
            fromStringValue: undefined,
            toCurrency: undefined,
            toStringValue: undefined,
            fromValue: undefined,
            toValue: undefined,
            isFromCrypto: undefined,
            isToCrypto: undefined,
            formattedRate: undefined,
        });
    });

    it('should handle trade with missing values', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const tradeWithMissingValues = {
            ...buyTrade.data,
            fiatStringAmount: undefined,
            receiveStringAmount: undefined,
        };

        const { result } = await renderHookWithStoreProviderAsync(
            () => useChangeStringsExtractor(tradeWithMissingValues),
            { preloadedState: { wallet: { tradingNew: getInitializedTradingState() } } },
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
            formattedRate: undefined,
        });
    });
});
