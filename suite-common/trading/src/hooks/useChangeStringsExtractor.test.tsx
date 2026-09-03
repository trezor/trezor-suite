import type { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';

import {
    type BuyTrade,
    type Coins,
    type CryptoId,
    type ExchangeTrade,
    type SellFiatTrade,
} from 'invity-api';

import { MockedFormatterProvider } from '@suite-common/formatters/mocks';

import { useChangeStringsExtractor } from './useChangeStringsExtractor';
import {
    createTradingTestState,
    renderHookWithTradingStore,
} from '../test-utils/testUtils';
import type { TradingTradeType } from '../types';

const FormattersProvider = ({ children }: PropsWithChildren) => (
    <IntlProvider locale="en">
        <MockedFormatterProvider>{children}</MockedFormatterProvider>
    </IntlProvider>
);

const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;
const ETHEREUM_CRYPTO_ID = 'ethereum' as CryptoId;
const USDC_CRYPTO_ID = 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId;

const coins = {
    bitcoin: {
        symbol: 'btc',
        name: 'Bitcoin',
        coingeckoId: 'bitcoin',
        services: { buy: true, sell: true, exchange: true },
    },
    ethereum: {
        symbol: 'eth',
        name: 'Ethereum',
        coingeckoId: 'ethereum',
        services: { buy: true, sell: true, exchange: true },
    },
    'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
        symbol: 'usdc',
        name: 'USDC',
        coingeckoId: 'usd-coin',
        services: { buy: true, sell: true, exchange: true },
    },
} satisfies Coins;

const buyTrade = {
    exchange: 'test-buy',
    fiatCurrency: 'USD',
    fiatStringAmount: '1234',
    receiveCurrency: ETHEREUM_CRYPTO_ID,
    receiveStringAmount: '0.462586',
    orderId: 'order-id-buy',
} satisfies BuyTrade;

const sellTrade = {
    exchange: 'test-sell',
    cryptoCurrency: BITCOIN_CRYPTO_ID,
    cryptoStringAmount: '1.22',
    fiatCurrency: 'USD',
    fiatStringAmount: '100',
    orderId: 'order-id-sell',
} satisfies SellFiatTrade;

const exchangeTrade = {
    exchange: 'test-exchange',
    send: USDC_CRYPTO_ID,
    sendStringAmount: '10.1232',
    receive: ETHEREUM_CRYPTO_ID,
    receiveStringAmount: '0.462586',
    orderId: 'order-id-exchange',
} satisfies ExchangeTrade;

describe('useChangeStringsExtractor', () => {
    const renderUseChangeStringsExtractor = (trade: TradingTradeType | undefined) =>
        renderHookWithTradingStore(() => useChangeStringsExtractor(trade), {
            preloadedState: createTradingTestState({ info: { coins, platforms: undefined } }),
            wrapper: FormattersProvider,
        });

    it('should extract strings for buy trade', () => {
        const { result } = renderUseChangeStringsExtractor(buyTrade);

        expect(result.current).toEqual({
            fromCurrency: 'USD',
            fromStringValue: '$1,234.00',
            toCurrency: ETHEREUM_CRYPTO_ID,
            toStringValue: '0.462586 ETH',
            fromValue: '1234',
            toValue: '0.462586',
            isFromCrypto: false,
            isToCrypto: true,
            formattedRate: '$2,667.61 / 1 ETH',
        });
    });

    it('should extract strings for sell trade', () => {
        const { result } = renderUseChangeStringsExtractor(sellTrade);

        expect(result.current).toEqual({
            fromCurrency: BITCOIN_CRYPTO_ID,
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
        const { result } = renderUseChangeStringsExtractor(exchangeTrade);

        expect(result.current).toEqual({
            fromCurrency: USDC_CRYPTO_ID,
            fromStringValue: '10.1232 USDC',
            toCurrency: ETHEREUM_CRYPTO_ID,
            toStringValue: '0.462586 ETH',
            fromValue: '10.1232',
            toValue: '0.462586',
            isFromCrypto: true,
            isToCrypto: true,
            formattedRate: '21.8839307717916236 USDC / 1 ETH',
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
        const tradeWithMissingValues = {
            ...buyTrade,
            fiatStringAmount: undefined,
            receiveStringAmount: undefined,
        };

        const { result } = renderUseChangeStringsExtractor(tradeWithMissingValues);

        expect(result.current).toEqual({
            fromCurrency: 'USD',
            fromStringValue: undefined,
            toCurrency: ETHEREUM_CRYPTO_ID,
            toStringValue: undefined,
            fromValue: undefined,
            toValue: undefined,
            isFromCrypto: false,
            isToCrypto: true,
            formattedRate: undefined,
        });
    });
});
