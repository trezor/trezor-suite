import type { TradingTradeType } from '@suite-common/trading';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import {
    getInitializedTradingStateWithQuotes,
    mockWalletFiatRatesAndSettings,
} from '@suite-native/trading-fixtures';

import { ProviderListItem, type ProviderListItemProps } from '../ProviderListItem';

describe('ProviderListItem', () => {
    const renderProviderListItem = (
        quote: TradingTradeType,
        overrides: PreloadedState = {},
        props?: Partial<ProviderListItemProps<TradingTradeType>>,
    ) =>
        renderWithStoreProvider(
            <ProviderListItem
                isSelected={false}
                onPress={jest.fn()}
                quote={quote}
                tradingType="buy"
                {...props}
            />,
            {
                preloadedState: {
                    ...overrides,
                    wallet: {
                        ...mockWalletFiatRatesAndSettings(),
                        ...overrides?.wallet,
                    },
                },
            },
        );

    it('should render provider information correctly', () => {
        const preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.trading.buy.quotes?.[0];
        if (!quote) throw new Error('Expected buy quote at index 0');

        const { getByText } = renderProviderListItem(quote, preloadedState, {});

        expect(getByText('Mercuryo')).toBeOnTheScreen();
    });

    it('should render trading information with formatted strings', () => {
        const preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.trading.buy.quotes?.[0];
        if (!quote) throw new Error('Expected buy quote at index 0');

        const { getByText } = renderProviderListItem(quote, preloadedState, {});

        expect(getByText('Centralized exchange')).toBeOnTheScreen();
        expect(getByText('€9,998.32 / 1 BTC')).toBeOnTheScreen();
    });

    it('should render KYC information when provider has KYC policy', () => {
        const preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.trading.exchange.quotes?.[2];
        if (!quote) throw new Error('Expected exchange quote at index 2');

        const { getByText } = renderProviderListItem(quote, preloadedState, {
            tradingType: 'exchange',
        });

        expect(getByText('This provider requires to verify identity.')).toBeOnTheScreen();
    });

    it('should render anonymous information for DEX providers', () => {
        const preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.trading.exchange.quotes?.[3];
        if (!quote) throw new Error('Expected exchange quote at index 3');

        const { getByText } = renderProviderListItem(quote, preloadedState, {
            tradingType: 'exchange',
        });

        expect(getByText('Anonymous')).toBeOnTheScreen();
        expect(getByText('Decentralized exchange')).toBeOnTheScreen();
    });

    it('should not render when quote has no orderId', () => {
        const preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        const baseQuote = preloadedState.wallet.trading.buy.quotes?.[0];
        if (!baseQuote) throw new Error('Expected buy quote at index 0');
        const { orderId, ...quoteWithoutOrderId } = baseQuote;
        const quote = quoteWithoutOrderId as TradingTradeType;

        const { queryByText } = renderProviderListItem(quote, preloadedState, {});

        expect(queryByText('TestProvider')).toBeNull();
    });

    it('should render KYC warning for buy quote', () => {
        const preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.trading.buy.quotes?.[0];
        if (!quote) throw new Error('Expected buy quote at index 0');

        const { getByText } = renderProviderListItem(quote, preloadedState, {});

        expect(getByText('This provider requires to verify identity.')).toBeOnTheScreen();
    });

    it('should render KYC warning for sell quote', () => {
        const preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.trading.sell.quotes?.[0];
        if (!quote) throw new Error('Expected sell quote at index 0');

        const { getByText } = renderProviderListItem(quote, preloadedState, {
            tradingType: 'sell',
        });

        expect(getByText('This provider requires to verify identity.')).toBeOnTheScreen();
    });
});
