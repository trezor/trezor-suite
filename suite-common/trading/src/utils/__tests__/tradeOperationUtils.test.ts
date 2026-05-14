import type {
    BuyTrade,
    BuyTradeStatus,
    CryptoId,
    ExchangeTrade,
    ExchangeTradeStatus,
    SellFiatTrade,
    SellTradeStatus,
} from 'invity-api';

import { getTradeOperationData } from '../tradeOperationUtils';

const buildBuyTrade = (status: BuyTradeStatus | undefined): BuyTrade =>
    ({
        fiatStringAmount: '1234',
        fiatCurrency: 'USD',
        receiveStringAmount: '0.462586',
        receiveCurrency: 'ethereum' as CryptoId,
        status,
    }) as BuyTrade;

const buildSellTrade = (status: SellTradeStatus | undefined): SellFiatTrade =>
    ({
        cryptoStringAmount: '1.22',
        cryptoCurrency: 'bitcoin' as CryptoId,
        fiatStringAmount: '100',
        fiatCurrency: 'USD',
        status,
    }) as SellFiatTrade;

const buildExchangeTrade = (status: ExchangeTradeStatus | undefined): ExchangeTrade =>
    ({
        send: 'solana--jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL' as CryptoId,
        sendStringAmount: '10.1232',
        receive: 'solana' as CryptoId,
        receiveStringAmount: '0.462586',
        status,
    }) as ExchangeTrade;

describe('getTradeOperationData', () => {
    it('should return correct data for buy trade', () => {
        const result = getTradeOperationData(buildBuyTrade('SUBMITTED'));

        expect(result).toEqual({
            fromValue: '1234',
            fromCurrency: 'USD',
            toValue: '0.462586',
            toCurrency: 'ethereum',
            isFromCrypto: false,
            isToCrypto: true,
        });
    });

    it('should return correct data for exchange trade', () => {
        const result = getTradeOperationData(buildExchangeTrade('CONVERTING'));

        expect(result).toEqual({
            fromValue: '10.1232',
            fromCurrency: 'solana--jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
            toValue: '0.462586',
            toCurrency: 'solana',
            isFromCrypto: true,
            isToCrypto: true,
        });
    });

    it('should return correct data for sell trade', () => {
        const result = getTradeOperationData(buildSellTrade('SEND_CRYPTO'));

        expect(result).toEqual({
            fromValue: '1.22',
            fromCurrency: 'bitcoin',
            toValue: '100',
            toCurrency: 'USD',
            isFromCrypto: true,
            isToCrypto: false,
        });
    });

    it('should return undefined values for undefined transaction', () => {
        const result = getTradeOperationData(undefined);

        expect(result).toEqual({
            fromValue: undefined,
            fromCurrency: undefined,
            toValue: undefined,
            toCurrency: undefined,
            isFromCrypto: undefined,
            isToCrypto: undefined,
        });
    });
});
