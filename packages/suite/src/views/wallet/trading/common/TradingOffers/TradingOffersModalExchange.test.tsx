import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type CryptoId, type ExchangeProviderInfo, type ExchangeTrade } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { initialState as tradingInitialState } from '@suite-common/trading';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingOffersModalExchange } from './TradingOffersModalExchange';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

jest.mock('react-hook-form', () => ({
    ...jest.requireActual('react-hook-form'),
    useFormContext: () => ({ getValues: () => undefined, setValue: () => undefined }),
}));

jest.mock('./TradingOffersModalItem', () => ({
    TradingOffersModalItem: ({ quote }: { quote: ExchangeTrade }) => (
        <div data-testid="@trading/offers/quote">{quote.exchange}</div>
    ),
}));

const BITCOIN_CRYPTO_ID = 'bitcoin' as CryptoId;
const ETHEREUM_CRYPTO_ID = 'ethereum' as CryptoId;

const mockExchangeProvider = (isFixedRate: boolean, isDex: boolean): ExchangeProviderInfo => ({
    name: 'provider',
    companyName: 'Provider',
    logo: 'provider-icon.jpg',
    isActive: true,
    isFixedRate,
    isDex,
    buyTickers: [ETHEREUM_CRYPTO_ID],
    sellTickers: [BITCOIN_CRYPTO_ID],
    addressFormats: {},
    supportUrl: 'https://example.com/support',
    kycPolicyType: isDex ? 'DEX' : 'KYC-required',
});

const mockExchangeQuote = (exchange: string, rate: number, isDex: boolean): ExchangeTrade => ({
    exchange,
    rate,
    isDex,
    orderId: `order-${exchange}`,
    send: BITCOIN_CRYPTO_ID,
    sendStringAmount: '1',
    receive: ETHEREUM_CRYPTO_ID,
    receiveStringAmount: String(rate),
});

const providerInfos: Record<string, ExchangeProviderInfo> = {
    'float-cex': mockExchangeProvider(false, false),
    'float-cex-worse': mockExchangeProvider(false, false),
    dex: mockExchangeProvider(false, true),
    'fixed-cex': mockExchangeProvider(true, false),
};

const quotes: ExchangeTrade[] = [
    mockExchangeQuote('dex', 30, true),
    mockExchangeQuote('float-cex', 20, false),
    mockExchangeQuote('float-cex-worse', 10, false),
    mockExchangeQuote('fixed-cex', 5, false),
];

const renderOffersModal = (exchangeQuotes: ExchangeTrade[]) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: {
            ...mockInitialAppState,
            wallet: {
                ...mockInitialAppState.wallet,
                trading: {
                    ...tradingInitialState,
                    exchange: {
                        ...tradingInitialState.exchange,
                        exchangeInfo: {
                            providerInfos,
                            buyCryptoIds: [ETHEREUM_CRYPTO_ID],
                            sellCryptoIds: [BITCOIN_CRYPTO_ID],
                        },
                        quotes: exchangeQuotes,
                    },
                },
            },
        } satisfies AppState,
    });

    renderWithProviders(services, <TradingOffersModalExchange onClose={() => undefined} />);
};

const getRenderedProviders = () =>
    screen.queryAllByTestId('@trading/offers/quote').map(quote => quote.textContent);

describe('TradingOffersModalExchange', () => {
    it('merges DEX offers into the floating-rate group and keeps the order returned by backend', () => {
        renderOffersModal(quotes);

        expect(getRenderedProviders()).toEqual([
            'dex',
            'float-cex',
            'float-cex-worse',
            'fixed-cex',
        ]);
    });

    it('keeps both groups when a filter is applied', async () => {
        renderOffersModal(quotes);

        await userEvent.click(screen.getByTestId('@trading/offers/filter/dex'));

        expect(getRenderedProviders()).toEqual(['dex']);
        expect(screen.getAllByTestId('@trading/offers/group-empty')).toHaveLength(1);
    });

    it('shows centralized offers of both rate types', async () => {
        renderOffersModal(quotes);

        await userEvent.click(screen.getByTestId('@trading/offers/filter/cex'));

        expect(getRenderedProviders()).toEqual(['float-cex', 'float-cex-worse', 'fixed-cex']);
        expect(screen.queryByTestId('@trading/offers/group-empty')).toBeNull();
    });

    it('shows the empty state instead of the groups when there are no offers at all', () => {
        renderOffersModal([]);

        expect(getRenderedProviders()).toEqual([]);
        expect(screen.queryByTestId('@trading/offers/group-empty')).toBeNull();
    });
});
