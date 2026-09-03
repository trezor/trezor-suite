import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import {
    type BuyTrade,
    type BuyTradeQuoteRequest,
    type Coins,
    type CryptoId,
    type ExchangeTrade,
} from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TradingTradeType, initialState as tradingInitialState } from '@suite-common/trading';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingQuoteAmount } from './TradingQuoteAmount';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;
const ETHEREUM_CRYPTO_ID = 'ethereum' as CryptoId;

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
} satisfies Coins;

const buyQuote = {
    exchange: 'test-buy',
    fiatCurrency: 'USD',
    fiatStringAmount: '10',
    receiveCurrency: BITCOIN_CRYPTO_ID,
    receiveStringAmount: '0.002',
    orderId: 'order-id-buy',
} satisfies BuyTrade;

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

const renderQuoteAmount = (quote: TradingTradeType, buyQuotesRequest?: BuyTradeQuoteRequest) => {
    const root = createTestCompositionRoot({
        extra: { services: {} },
        preloadedState: {
            ...mockInitialAppState,
            wallet: {
                ...mockInitialAppState.wallet,
                trading: {
                    ...tradingInitialState,
                    info: { ...tradingInitialState.info, coins },
                    buy: { ...tradingInitialState.buy, quotesRequest: buyQuotesRequest },
                },
            },
        } satisfies AppState,
    });

    renderWithProviders(root, <TradingQuoteAmount quote={quote} />);
};

describe('TradingQuoteAmount', () => {
    it('shows the crypto amount for a buy quote requested in fiat', () => {
        renderQuoteAmount(buyQuote, {
            wantCrypto: false,
            fiatStringAmount: '10',
            fiatCurrency: 'USD',
            receiveCurrency: BITCOIN_CRYPTO_ID,
        });

        expect(screen.getByTestId('@trading/quote/amount')).toHaveTextContent('0.002 BTC');
    });

    it('shows the fiat amount for a buy quote requested in crypto', () => {
        renderQuoteAmount(buyQuote, {
            wantCrypto: true,
            cryptoStringAmount: '0.002',
            fiatCurrency: 'USD',
            receiveCurrency: BITCOIN_CRYPTO_ID,
        });

        expect(screen.getByTestId('@trading/quote/amount')).toHaveTextContent('$10.00');
    });

    it('shows the receive amount for an exchange quote', () => {
        renderQuoteAmount(exchangeQuote);

        expect(screen.getByTestId('@trading/quote/amount')).toHaveTextContent('10 ETH');
    });
});
