import {
    type BuyTrade,
    type BuyTradeQuoteRequest,
    type CryptoId,
    type ExchangeTrade,
    type ExchangeTradeQuoteRequest,
    type SellFiatTrade,
    type SellFiatTradeQuoteRequest,
} from 'invity-api';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';

import { useTradingRequestedAmountShortfall } from './useTradingRequestedAmountShortfall';
import { type TradingRootState, initialState } from '../reducers/tradingCommonReducer';

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

type QuotesRequests = {
    buyQuotesRequest?: BuyTradeQuoteRequest;
    sellQuotesRequest?: SellFiatTradeQuoteRequest;
    exchangeQuotesRequest?: ExchangeTradeQuoteRequest;
};

const renderUseTradingRequestedAmountShortfall = (
    quote: BuyTrade | SellFiatTrade | ExchangeTrade,
    { buyQuotesRequest, sellQuotesRequest, exchangeQuotesRequest }: QuotesRequests = {},
) => {
    const root = createTestCompositionRoot({
        extra: { services: {} },
        preloadedState: {
            wallet: {
                trading: {
                    ...initialState,
                    buy: { ...initialState.buy, quotesRequest: buyQuotesRequest },
                    sell: { ...initialState.sell, quotesRequest: sellQuotesRequest },
                    exchange: { ...initialState.exchange, quotesRequest: exchangeQuotesRequest },
                },
            },
        } satisfies TradingRootState,
    });

    return renderHookWithStoreProvider(() => useTradingRequestedAmountShortfall({ quote }), {
        root,
    });
};

describe('useTradingRequestedAmountShortfall', () => {
    it('returns crypto shortfall for buy when wantCrypto is true', () => {
        const { result } = renderUseTradingRequestedAmountShortfall(
            {
                ...buyQuote,
                receiveStringAmount: '0.8',
            },
            {
                buyQuotesRequest: {
                    wantCrypto: true,
                    fiatCurrency: 'USD',
                    receiveCurrency: BITCOIN_CRYPTO_ID,
                    cryptoStringAmount: '1',
                },
            },
        );

        expect(result.current?.shortfallRatio).toBeCloseTo(0.2);
        expect(result.current?.cryptoShortfall).toEqual({
            amount: '0.2',
            cryptoId: BITCOIN_CRYPTO_ID,
        });
        expect(result.current?.fiatShortfall).toBeUndefined();
    });

    it('returns shortfall for buy when wantCrypto is false', () => {
        const { result } = renderUseTradingRequestedAmountShortfall(
            {
                ...buyQuote,
                fiatStringAmount: '90',
            },
            {
                buyQuotesRequest: {
                    wantCrypto: false,
                    fiatCurrency: 'USD',
                    receiveCurrency: BITCOIN_CRYPTO_ID,
                    fiatStringAmount: '100',
                },
            },
        );

        expect(result.current).toEqual({
            shortfallRatio: 0.1,
            fiatShortfall: 10,
        });
    });

    it('returns crypto shortfall for sell when amountInCrypto is true', () => {
        const { result } = renderUseTradingRequestedAmountShortfall(sellQuote, {
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

        expect(result.current).toEqual({
            shortfallRatio: 0.2,
            cryptoShortfall: {
                amount: '0.5',
                cryptoId: ETHEREUM_CRYPTO_ID,
            },
        });
    });

    it('returns shortfall for sell when amountInCrypto is false', () => {
        const { result } = renderUseTradingRequestedAmountShortfall(
            {
                ...sellQuote,
                fiatStringAmount: '70',
            },
            {
                sellQuotesRequest: {
                    amountInCrypto: false,
                    cryptoCurrency: ETHEREUM_CRYPTO_ID,
                    fiatCurrency: 'USD',
                    country: 'CZ',
                    fiatStringAmount: '100',
                    flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
                },
            },
        );

        expect(result.current).toEqual({
            shortfallRatio: 0.3,
            fiatShortfall: 30,
        });
    });

    it('returns crypto shortfall for exchange when the quote send amount is lower than requested', () => {
        const { result } = renderUseTradingRequestedAmountShortfall(exchangeQuote, {
            exchangeQuotesRequest: {
                send: BITCOIN_CRYPTO_ID,
                receive: ETHEREUM_CRYPTO_ID,
                sendStringAmount: '2',
            },
        });

        expect(result.current).toEqual({
            shortfallRatio: 0.25,
            cryptoShortfall: {
                amount: '0.5',
                cryptoId: BITCOIN_CRYPTO_ID,
            },
        });
    });

    it('does not return shortfall for exchange when the quote send amount matches the request', () => {
        const { result } = renderUseTradingRequestedAmountShortfall(exchangeQuote, {
            exchangeQuotesRequest: {
                send: BITCOIN_CRYPTO_ID,
                receive: ETHEREUM_CRYPTO_ID,
                sendStringAmount: exchangeQuote.sendStringAmount,
            },
        });

        expect(result.current).toBeNull();
    });

    it('returns null on exact match', () => {
        const { result } = renderUseTradingRequestedAmountShortfall(buyQuote, {
            buyQuotesRequest: {
                wantCrypto: true,
                fiatCurrency: 'USD',
                receiveCurrency: BITCOIN_CRYPTO_ID,
                cryptoStringAmount: buyQuote.receiveStringAmount,
            },
        });

        expect(result.current).toBeNull();
    });

    it('returns null when request is missing', () => {
        const { result } = renderUseTradingRequestedAmountShortfall(buyQuote);

        expect(result.current).toBeNull();
    });

    it('returns null when request amount or quote amount is missing', () => {
        const { result } = renderUseTradingRequestedAmountShortfall(
            {
                ...buyQuote,
                receiveStringAmount: undefined,
            },
            {
                buyQuotesRequest: {
                    wantCrypto: true,
                    fiatCurrency: 'USD',
                    receiveCurrency: BITCOIN_CRYPTO_ID,
                    cryptoStringAmount: '1',
                },
            },
        );

        expect(result.current).toBeNull();
    });
});
