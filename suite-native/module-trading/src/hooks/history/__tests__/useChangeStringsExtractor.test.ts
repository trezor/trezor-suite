import type { TradingTradeType } from '@suite-common/trading';
import { renderHookWithStoreProvider } from '@suite-native/test-utils';
import {
    getBuyTrade,
    getExchangeTrade,
    getInitializedTradingState,
    getSellTrade,
} from '@suite-native/trading-fixtures';

import { useChangeStringsExtractor } from '../useChangeStringsExtractor';

describe('useChangeStringsExtractor', () => {
    const getPreloadedState = () => ({ wallet: { trading: getInitializedTradingState() } });

    const renderUseChangeStringsExtractor = (data: TradingTradeType | undefined) =>
        renderHookWithStoreProvider(() => useChangeStringsExtractor(data), {
            preloadedState: getPreloadedState(),
        });

    it('should extract strings for buy trade', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const { result } = renderUseChangeStringsExtractor(buyTrade.data);

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

    it('should extract strings for sell trade', () => {
        const sellTrade = getSellTrade({ status: 'SUBMITTED' });
        const { result } = renderUseChangeStringsExtractor(sellTrade.data);

        expect(result.current).toEqual({
            fromCurrency: 'bitcoin',
            fromStringValue: '1.22 BTC',
            toCurrency: 'USD',
            toStringValue: '$100.00',
            fromValue: '1.22',
            toValue: '100',
            isFromCrypto: true,
            isToCrypto: false,
            formattedRate: '0.0122 BTC / $1',
        });
    });

    it('should extract strings for exchange trade', () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONFIRM' });
        const { result } = renderUseChangeStringsExtractor(exchangeTrade.data);

        expect(result.current).toEqual({
            fromCurrency: 'solana--jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
            fromStringValue: '10.1232 JTO',
            toCurrency: 'solana',
            toStringValue: '0.462586 SOL',
            fromValue: '10.1232',
            toValue: '0.462586',
            isFromCrypto: true,
            isToCrypto: true,
            formattedRate: '21.883930771791622 JTO / 1 SOL',
        });
    });

    it('should handle undefined trade', () => {
        const { result } = renderUseChangeStringsExtractor(undefined);

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

    it('should handle trade with missing values', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });
        const tradeWithMissingValues = {
            ...buyTrade.data,
            fiatStringAmount: undefined,
            receiveStringAmount: undefined,
        };

        const { result } = renderUseChangeStringsExtractor(tradeWithMissingValues);

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
