import {
    type BuyTrade,
    type BuyTradeQuoteRequest,
    type CryptoId,
    type ExchangeTrade,
    type SellFiatTrade,
    type SellFiatTradeQuoteRequest,
} from 'invity-api';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';

import { useTradingRequestedSide } from './useTradingRequestedSide';
import { type TradingRootState, initialState } from '../reducers/tradingCommonReducer';

const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;
const ETHEREUM_CRYPTO_ID = 'ethereum' as CryptoId;

const buyQuote = {
    exchange: 'test-buy',
    fiatCurrency: 'USD',
    fiatStringAmount: '10',
    receiveCurrency: BITCOIN_CRYPTO_ID,
    receiveStringAmount: '0.002',
    orderId: 'order-id-buy',
} satisfies BuyTrade;

const sellQuote = {
    exchange: 'test-sell',
    fiatCurrency: 'USD',
    fiatStringAmount: '80',
    cryptoCurrency: ETHEREUM_CRYPTO_ID,
    cryptoStringAmount: '2',
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
};

const renderUseTradingRequestedSide = (
    quote: BuyTrade | SellFiatTrade | ExchangeTrade | undefined,
    { buyQuotesRequest, sellQuotesRequest }: QuotesRequests = {},
) => {
    const root = createTestCompositionRoot({
        extra: { services: {} },
        preloadedState: {
            wallet: {
                trading: {
                    ...initialState,
                    buy: { ...initialState.buy, quotesRequest: buyQuotesRequest },
                    sell: { ...initialState.sell, quotesRequest: sellQuotesRequest },
                },
            },
        } satisfies TradingRootState,
    });

    return renderHookWithStoreProvider(() => useTradingRequestedSide(quote), { root });
};

describe('useTradingRequestedSide', () => {
    it("returns 'to' for buy when wantCrypto is true", () => {
        const { result } = renderUseTradingRequestedSide(buyQuote, {
            buyQuotesRequest: {
                wantCrypto: true,
                fiatCurrency: 'USD',
                receiveCurrency: BITCOIN_CRYPTO_ID,
            },
        });

        expect(result.current).toBe('to');
    });

    it("returns 'from' for buy when wantCrypto is false", () => {
        const { result } = renderUseTradingRequestedSide(buyQuote, {
            buyQuotesRequest: {
                wantCrypto: false,
                fiatCurrency: 'USD',
                receiveCurrency: BITCOIN_CRYPTO_ID,
            },
        });

        expect(result.current).toBe('from');
    });

    it("returns 'from' for buy when there is no request", () => {
        const { result } = renderUseTradingRequestedSide(buyQuote);

        expect(result.current).toBe('from');
    });

    it("returns 'from' for sell when amountInCrypto is true", () => {
        const { result } = renderUseTradingRequestedSide(sellQuote, {
            sellQuotesRequest: {
                amountInCrypto: true,
                fiatCurrency: 'USD',
                cryptoCurrency: ETHEREUM_CRYPTO_ID,
            },
        });

        expect(result.current).toBe('from');
    });

    it("returns 'to' for sell when amountInCrypto is false", () => {
        const { result } = renderUseTradingRequestedSide(sellQuote, {
            sellQuotesRequest: {
                amountInCrypto: false,
                fiatCurrency: 'USD',
                cryptoCurrency: ETHEREUM_CRYPTO_ID,
            },
        });

        expect(result.current).toBe('to');
    });

    it('returns undefined for exchange', () => {
        const { result } = renderUseTradingRequestedSide(exchangeQuote);

        expect(result.current).toBeUndefined();
    });

    it('returns undefined when there is no quote', () => {
        const { result } = renderUseTradingRequestedSide(undefined);

        expect(result.current).toBeUndefined();
    });
});
