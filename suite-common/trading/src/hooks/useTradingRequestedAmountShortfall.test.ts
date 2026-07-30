import { renderHook } from '@testing-library/react';
import { type BuyTrade, type CryptoId, type ExchangeTrade, type SellFiatTrade } from 'invity-api';

import { useSelector } from './useSelector';
import { useTradingRequestedAmountShortfall } from './useTradingRequestedAmountShortfall';

jest.mock('./useSelector', () => ({
    useSelector: jest.fn(),
}));

const mockedUseSelector = jest.mocked(useSelector);

const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;
const ETHEREUM_CRYPTO_ID = 'ethereum' as CryptoId;

const buyQuote = {
    exchange: 'test-buy',
    fiatCurrency: 'USD',
    fiatStringAmount: '10',
    receiveCurrency: BITCOIN_CRYPTO_ID,
    receiveStringAmount: '0.002',
    paymentMethod: 'creditCard',
    paymentMethodName: 'Credit Card',
    orderId: 'order-id-buy',
} satisfies BuyTrade;

const sellQuote = {
    exchange: 'test-sell',
    fiatCurrency: 'USD',
    fiatStringAmount: '80',
    cryptoCurrency: ETHEREUM_CRYPTO_ID,
    cryptoStringAmount: '2',
    amountInCrypto: true,
    country: 'CZ',
    paymentMethod: 'bankTransfer',
    paymentMethodName: 'Bank Transfer',
    orderId: 'order-id-sell',
} satisfies SellFiatTrade;

const exchangeQuote = {
    exchange: 'test-exchange',
    send: BITCOIN_CRYPTO_ID,
    sendStringAmount: '1.5',
    receive: ETHEREUM_CRYPTO_ID,
    receiveStringAmount: '10',
    orderId: 'order-id-exchange',
    rate: 100,
    min: 0,
    max: 100,
} satisfies ExchangeTrade;

const mockQuotesRequests = ({
    buyQuotesRequest,
    sellQuotesRequest,
    exchangeQuotesRequest,
}: {
    buyQuotesRequest?: unknown;
    sellQuotesRequest?: unknown;
    exchangeQuotesRequest?: unknown;
}) => {
    mockedUseSelector
        .mockReturnValueOnce(buyQuotesRequest)
        .mockReturnValueOnce(sellQuotesRequest)
        .mockReturnValueOnce(exchangeQuotesRequest);
};

const renderUseTradingRequestedAmountShortfall = (
    quote: BuyTrade | SellFiatTrade | ExchangeTrade,
) => renderHook(() => useTradingRequestedAmountShortfall({ quote }));

describe('useTradingRequestedAmountShortfall', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('returns crypto shortfall for buy when wantCrypto is true', () => {
        mockQuotesRequests({
            buyQuotesRequest: {
                wantCrypto: true,
                fiatCurrency: 'USD',
                receiveCurrency: BITCOIN_CRYPTO_ID,
                cryptoStringAmount: '1',
            },
        });

        const { result } = renderUseTradingRequestedAmountShortfall({
            ...buyQuote,
            receiveStringAmount: '0.8',
        });

        expect(result.current?.shortfallRatio).toBeCloseTo(0.2);
        expect(result.current?.cryptoShortfall).toEqual({
            amount: '0.2',
            cryptoId: BITCOIN_CRYPTO_ID,
        });
        expect(result.current?.fiatShortfall).toBeUndefined();
    });

    it('returns shortfall for buy when wantCrypto is false', () => {
        mockQuotesRequests({
            buyQuotesRequest: {
                wantCrypto: false,
                fiatCurrency: 'USD',
                receiveCurrency: BITCOIN_CRYPTO_ID,
                fiatStringAmount: '100',
            },
        });

        const { result } = renderUseTradingRequestedAmountShortfall({
            ...buyQuote,
            fiatStringAmount: '90',
        });

        expect(result.current).toEqual({
            shortfallRatio: 0.1,
            fiatShortfall: 10,
        });
    });

    it('returns crypto shortfall for sell when amountInCrypto is true', () => {
        mockQuotesRequests({
            sellQuotesRequest: {
                amountInCrypto: true,
                cryptoCurrency: ETHEREUM_CRYPTO_ID,
                fiatCurrency: 'USD',
                country: 'CZ',
                fiatStringAmount: '80',
                cryptoStringAmount: '2.5',
                flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
            },
        });

        const { result } = renderUseTradingRequestedAmountShortfall(sellQuote);

        expect(result.current).toEqual({
            shortfallRatio: 0.2,
            cryptoShortfall: {
                amount: '0.5',
                cryptoId: ETHEREUM_CRYPTO_ID,
            },
        });
    });

    it('returns shortfall for sell when amountInCrypto is false', () => {
        mockQuotesRequests({
            sellQuotesRequest: {
                amountInCrypto: false,
                cryptoCurrency: ETHEREUM_CRYPTO_ID,
                fiatCurrency: 'USD',
                country: 'CZ',
                fiatStringAmount: '100',
                flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
            },
        });

        const { result } = renderUseTradingRequestedAmountShortfall({
            ...sellQuote,
            fiatStringAmount: '70',
        });

        expect(result.current).toEqual({
            shortfallRatio: 0.3,
            fiatShortfall: 30,
        });
    });

    it('does not return shortfall for exchange', () => {
        mockQuotesRequests({
            exchangeQuotesRequest: {
                send: BITCOIN_CRYPTO_ID,
                receive: ETHEREUM_CRYPTO_ID,
                sendStringAmount: '2',
            },
        });

        const { result } = renderUseTradingRequestedAmountShortfall(exchangeQuote);

        expect(result.current).toEqual(null);
    });

    it('returns null on exact match', () => {
        mockQuotesRequests({
            buyQuotesRequest: {
                wantCrypto: true,
                fiatCurrency: 'USD',
                receiveCurrency: BITCOIN_CRYPTO_ID,
                cryptoStringAmount: buyQuote.receiveStringAmount,
            },
        });

        const { result } = renderUseTradingRequestedAmountShortfall(buyQuote);

        expect(result.current).toBeNull();
    });

    it('returns null when request is missing', () => {
        mockQuotesRequests({});

        const { result } = renderUseTradingRequestedAmountShortfall(buyQuote);

        expect(result.current).toBeNull();
    });

    it('returns null when request amount or quote amount is missing', () => {
        mockQuotesRequests({
            buyQuotesRequest: {
                wantCrypto: true,
                fiatCurrency: 'USD',
                receiveCurrency: BITCOIN_CRYPTO_ID,
                cryptoStringAmount: '1',
            },
        });

        const { result } = renderUseTradingRequestedAmountShortfall({
            ...buyQuote,
            receiveStringAmount: undefined,
        });

        expect(result.current).toBeNull();
    });
});
