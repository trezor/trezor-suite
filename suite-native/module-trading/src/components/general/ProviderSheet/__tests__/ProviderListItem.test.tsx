import { TradingTradeType } from '@suite-common/trading';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';

import { ProviderListItem, ProviderListItemProps } from '../ProviderListItem';

describe('ProviderListItem', () => {
    const renderProviderListItem = (
        quote: TradingTradeType,
        preloadedState: PreloadedState = {},
        props?: Partial<ProviderListItemProps<TradingTradeType>>,
    ) =>
        renderWithStoreProviderAsync(
            <ProviderListItem
                isSelected={false}
                onPress={jest.fn()}
                quote={quote}
                tradingType="buy"
                {...props}
            />,
            { preloadedState },
        );

    it('should render provider information correctly', async () => {
        const preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.trading.buy.quotes[0];

        const { queryByText } = await renderProviderListItem(quote, preloadedState, {});

        expect(queryByText('Mercuryo')).toBeTruthy();
    });

    it('should render trading information with formatted strings', async () => {
        const preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.trading.buy.quotes[0];

        const { queryByText } = await renderProviderListItem(quote, preloadedState, {});

        expect(queryByText('Rate')).toBeTruthy();
        expect(queryByText('You get')).toBeTruthy();
    });

    it('should render KYC information when provider has KYC policy', async () => {
        const preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.trading.exchange.quotes[2];

        const { queryByText } = await renderProviderListItem(quote, preloadedState, {
            tradingType: 'exchange',
        });

        expect(queryByText('This provider requires to verify identity.')).toBeTruthy();
    });

    it('should render anonymous information for DEX providers', async () => {
        const preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.trading.exchange.quotes[3];

        const { queryByText } = await renderProviderListItem(quote, preloadedState, {
            tradingType: 'exchange',
        });

        expect(queryByText('Anonymous')).toBeTruthy();
        expect(queryByText('Decentralized exchange')).toBeTruthy();
    });

    it('should not render when quote has no orderId', async () => {
        const preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        const baseQuote = preloadedState.wallet.trading.buy.quotes[0];
        const { orderId, ...quoteWithoutOrderId } = baseQuote;
        const quote = quoteWithoutOrderId as TradingTradeType;

        const { queryByText } = await renderProviderListItem(quote, preloadedState, {});

        expect(queryByText('TestProvider')).toBeNull();
    });

    it('should render KYC warning for buy quote', async () => {
        const preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.trading.buy.quotes[0];

        const { queryByText } = await renderProviderListItem(quote, preloadedState, {});

        expect(queryByText('This provider requires to verify identity.')).toBeTruthy();
    });

    it('should render KYC warning for sell quote', async () => {
        const preloadedState = { wallet: { trading: getInitializedTradingStateWithQuotes() } };
        const quote = preloadedState.wallet.trading.sell.quotes[0];

        const { queryByText } = await renderProviderListItem(quote, preloadedState, {
            tradingType: 'sell',
        });

        expect(queryByText('This provider requires to verify identity.')).toBeTruthy();
    });
});
