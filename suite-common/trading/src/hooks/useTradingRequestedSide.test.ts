import { renderHook } from '@testing-library/react';
import { type BuyTrade, type CryptoId, type ExchangeTrade, type SellFiatTrade } from 'invity-api';

import { useSelector } from './useSelector';
import { useTradingRequestedSide } from './useTradingRequestedSide';

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

const mockQuotesRequests = (buyQuotesRequest?: unknown, sellQuotesRequest?: unknown) => {
    mockedUseSelector.mockReturnValueOnce(buyQuotesRequest).mockReturnValueOnce(sellQuotesRequest);
};

describe('useTradingRequestedSide', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns 'to' for buy when wantCrypto is true", () => {
        mockQuotesRequests({ wantCrypto: true });

        const { result } = renderHook(() => useTradingRequestedSide(buyQuote));

        expect(result.current).toBe('to');
    });

    it("returns 'from' for buy when wantCrypto is false", () => {
        mockQuotesRequests({ wantCrypto: false });

        const { result } = renderHook(() => useTradingRequestedSide(buyQuote));

        expect(result.current).toBe('from');
    });

    it("returns 'from' for buy when there is no request", () => {
        mockQuotesRequests();

        const { result } = renderHook(() => useTradingRequestedSide(buyQuote));

        expect(result.current).toBe('from');
    });

    it("returns 'from' for sell when amountInCrypto is true", () => {
        mockQuotesRequests(undefined, { amountInCrypto: true });

        const { result } = renderHook(() => useTradingRequestedSide(sellQuote));

        expect(result.current).toBe('from');
    });

    it("returns 'to' for sell when amountInCrypto is false", () => {
        mockQuotesRequests(undefined, { amountInCrypto: false });

        const { result } = renderHook(() => useTradingRequestedSide(sellQuote));

        expect(result.current).toBe('to');
    });

    it('returns undefined for exchange', () => {
        mockQuotesRequests();

        const { result } = renderHook(() => useTradingRequestedSide(exchangeQuote));

        expect(result.current).toBeUndefined();
    });

    it('returns undefined when there is no quote', () => {
        mockQuotesRequests();

        const { result } = renderHook(() => useTradingRequestedSide(undefined));

        expect(result.current).toBeUndefined();
    });
});
