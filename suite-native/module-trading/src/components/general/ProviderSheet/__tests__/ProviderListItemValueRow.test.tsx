import type { TradingTradeType } from '@suite-common/trading';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils-store';
import { getInitializedTradingStateWithQuotes } from '@suite-native/trading-fixtures';

import { ProviderListItemValueRow } from '../ProviderListItemValueRow';

describe('ProviderListItemValueRow', () => {
    const getPreloadedState = () => ({
        wallet: {
            trading: getInitializedTradingStateWithQuotes(),
        },
    });

    const renderProviderListItemValueRow = (
        quote: TradingTradeType,
        preloadedState: PreloadedState = {},
    ) =>
        renderWithStoreProvider(<ProviderListItemValueRow quote={quote} />, {
            preloadedState,
        });

    it('should render formatted rate for a buy quote', () => {
        const preloadedState = getPreloadedState();
        const quote = preloadedState.wallet.trading.buy.quotes[0];

        const { getByText } = renderProviderListItemValueRow(quote, preloadedState);

        expect(getByText('€9,998.32 / 1 BTC')).toBeOnTheScreen();
    });

    it('should render formatted rate for a sell quote', () => {
        const preloadedState = getPreloadedState();
        const quote = preloadedState.wallet.trading.sell.quotes[0];

        const { getByText } = renderProviderListItemValueRow(quote, preloadedState);

        expect(getByText('0.000258400798491738 ETH / $1')).toBeOnTheScreen();
    });

    it('should render nothing when buy quote has zero receiveStringAmount', () => {
        const preloadedState = getPreloadedState();
        // The third buy quote has receiveStringAmount: '0' which results in no formattedRate
        const quote = preloadedState.wallet.trading.buy.quotes[2];

        const { toJSON } = renderProviderListItemValueRow(quote, preloadedState);

        expect(toJSON()).toBeNull();
    });
});
