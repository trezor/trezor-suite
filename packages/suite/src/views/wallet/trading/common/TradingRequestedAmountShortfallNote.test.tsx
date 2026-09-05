import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import { type BuyTrade, type BuyTradeQuoteRequest, type Coins, type CryptoId } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { initialState as tradingInitialState } from '@suite-common/trading';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingRequestedAmountShortfallNote } from './TradingRequestedAmountShortfallNote';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;

const coins = {
    bitcoin: {
        symbol: 'btc',
        name: 'Bitcoin',
        coingeckoId: 'bitcoin',
        services: { buy: true, sell: true, exchange: true },
    },
} satisfies Coins;

const buyQuote = {
    exchange: 'test-buy',
    fiatCurrency: 'USD',
    fiatStringAmount: '90',
    receiveCurrency: BITCOIN_CRYPTO_ID,
    receiveStringAmount: '0.0018',
    orderId: 'order-id-buy',
} satisfies BuyTrade;

const renderShortfallNote = (quote: BuyTrade, buyQuotesRequest: BuyTradeQuoteRequest) => {
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

    renderWithProviders(root, <TradingRequestedAmountShortfallNote quote={quote} />);
};

describe('TradingRequestedAmountShortfallNote', () => {
    it('shows the fiat shortfall when the quote pays out less fiat than requested', () => {
        renderShortfallNote(buyQuote, {
            wantCrypto: false,
            fiatStringAmount: '100',
            fiatCurrency: 'USD',
            receiveCurrency: BITCOIN_CRYPTO_ID,
        });

        expect(screen.getByTestId('@trading/quote/shortfall-note')).toHaveTextContent(
            '10.0% less to receive than requested ($10.00)',
        );
    });

    it('shows the crypto shortfall when the quote returns less crypto than requested', () => {
        renderShortfallNote(buyQuote, {
            wantCrypto: true,
            cryptoStringAmount: '0.002',
            fiatCurrency: 'USD',
            receiveCurrency: BITCOIN_CRYPTO_ID,
        });

        expect(screen.getByTestId('@trading/quote/shortfall-note')).toHaveTextContent(
            '10.0% less to receive than requested (0.0002 BTC)',
        );
    });

    it('renders nothing when the quote matches the request', () => {
        renderShortfallNote(buyQuote, {
            wantCrypto: false,
            fiatStringAmount: '90',
            fiatCurrency: 'USD',
            receiveCurrency: BITCOIN_CRYPTO_ID,
        });

        expect(screen.queryByTestId('@trading/quote/shortfall-note')).not.toBeInTheDocument();
    });
});
