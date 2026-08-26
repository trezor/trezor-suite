import { type TradingProviderInfo, type TradingTradeType } from '@suite-common/trading';
import {
    getInitializedTradingStateWithQuotes,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';

import { ProviderListItemInfo } from './ProviderListItemInfo';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

const provider = { companyName: 'Mercuryo', logo: '' } as TradingProviderInfo;

const overridesWithQuotes: PreloadedStatePartial<TradingTestPreloadedState> = {
    wallet: { trading: getInitializedTradingStateWithQuotes() },
};

describe('ProviderListItemInfo', () => {
    const renderProviderListItemInfo = async (
        quote: TradingTradeType,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = overridesWithQuotes,
    ) =>
        await renderWithTradingProvider(<ProviderListItemInfo quote={quote} provider={provider} />, {
            overrides,
        });

    it('should render shortfall note for a shortfall quote', async () => {
        const shortfallQuote = {
            ...mercuryoApplePayBuyQuote,
            fiatStringAmount: '8',
            orderId: 'order-id-shortfall-note',
        };

        const shortfallOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
            wallet: {
                trading: {
                    ...getInitializedTradingStateWithQuotes(),
                    buy: {
                        ...getInitializedTradingStateWithQuotes().buy,
                        quotesRequest: {
                            wantCrypto: false,
                            receiveCurrency: shortfallQuote.receiveCurrency,
                            fiatCurrency: 'EUR',
                            fiatStringAmount: '10',
                        },
                    },
                },
            },
        };

        const { getByText } = await renderProviderListItemInfo(shortfallQuote, shortfallOverrides);

        // The note is shown in the fiat currency the user is trading in (EUR from the quote).
        expect(getByText('20% less to receive than requested (€2.00)')).toBeOnTheScreen();
    });

    it('should not render shortfall note when quote does not have shortfall', async () => {
        const { queryByText } = await renderProviderListItemInfo(mercuryoApplePayBuyQuote);

        expect(queryByText(/less to receive/)).toBeNull();
    });
});
