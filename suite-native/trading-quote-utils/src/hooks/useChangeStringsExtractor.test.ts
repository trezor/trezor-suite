import type { TradingTradeType } from '@suite-common/trading';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import {
    getBuyTrade,
    getExchangeTrade,
    getInitializedTradingState,
    getSellTrade,
} from '@suite-native/trading-fixtures';

import { useChangeStringsExtractor } from './useChangeStringsExtractor';

describe('useChangeStringsExtractor', () => {
    const getPreloadedState = () => ({ wallet: { trading: getInitializedTradingState() } });

    const renderUseChangeStringsExtractor = async (data: TradingTradeType | undefined) =>
        await renderHookWithStoreProvider(() => useChangeStringsExtractor(data), {
            preloadedState: getPreloadedState(),
        });

    it('should extract strings for buy trade', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const { result } = await renderUseChangeStringsExtractor(buyTrade.data);

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

    it('should extract strings for sell trade', async () => {
        const sellTrade = getSellTrade({ status: 'SUBMITTED' });
        const { result } = await renderUseChangeStringsExtractor(sellTrade.data);

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

    it('should extract strings for exchange trade', async () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONFIRM' });
        const { result } = await renderUseChangeStringsExtractor(exchangeTrade.data);

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

    it('should handle undefined trade', async () => {
        const { result } = await renderUseChangeStringsExtractor(undefined);

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

    it('should handle trade with missing values', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const tradeWithMissingValues = {
            ...buyTrade.data,
            fiatStringAmount: undefined,
            receiveStringAmount: undefined,
        };

        const { result } = await renderUseChangeStringsExtractor(tradeWithMissingValues);

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
