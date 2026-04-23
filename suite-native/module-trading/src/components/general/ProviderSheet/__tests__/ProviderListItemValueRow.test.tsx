import type { TradingTradeType } from '@suite-common/trading';
import {
    banxaCreditCardSellQuote,
    getInitializedTradingStateWithQuotes,
    invityErrorBuyQuote,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { ProviderListItemValueRow } from '../ProviderListItemValueRow';

const overridesWithQuotes: PreloadedStatePartial<TradingTestPreloadedState> = {
    wallet: { trading: getInitializedTradingStateWithQuotes() },
};

describe('ProviderListItemValueRow', () => {
    const renderProviderListItemValueRow = (quote: TradingTradeType) =>
        renderWithTradingProvider(<ProviderListItemValueRow quote={quote} />, {
            overrides: overridesWithQuotes,
            providers: ['intl', 'formatter'],
        });

    it('should render formatted rate for a buy quote', () => {
        const { getByText } = renderProviderListItemValueRow(mercuryoApplePayBuyQuote);

        expect(getByText('€9,998.32 / 1 BTC')).toBeOnTheScreen();
    });

    it('should render formatted rate for a sell quote', () => {
        const { getByText } = renderProviderListItemValueRow(banxaCreditCardSellQuote);

        expect(getByText('0.000258400798491738 ETH / $1')).toBeOnTheScreen();
    });

    it('should render nothing when buy quote has zero receiveStringAmount', () => {
        // invityErrorBuyQuote has receiveStringAmount: '0' which results in no formattedRate
        const { toJSON } = renderProviderListItemValueRow(invityErrorBuyQuote);

        expect(toJSON()).toBeNull();
    });
});
