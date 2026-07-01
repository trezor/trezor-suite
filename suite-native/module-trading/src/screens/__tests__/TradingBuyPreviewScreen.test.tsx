import type { BuyTrade, ProviderMetadata } from 'invity-api';

import { getTranslation } from '@suite-native/intl';
import {
    buyMercuryo,
    getInitializedTradingState,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../__tests__/tradingTestUtils';
import { TradingBuyPreviewScreen } from '../TradingBuyPreviewScreen';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ setOptions: jest.fn() }),
    useRoute: () => ({ name: 'TradingBuyPreviewScreen' }),
}));

describe('TradingBuyPreviewScreen', () => {
    const renderTradingBuyPreviewScreen = ({
        providerMetadata,
        selectedQuote,
    }: {
        providerMetadata?: ProviderMetadata;
        selectedQuote?: BuyTrade;
    }) => {
        const tradingState = getInitializedTradingState('buy');
        tradingState.currentProviderMetadata = providerMetadata;
        tradingState.buy.selectedQuote = selectedQuote;

        return renderWithTradingProvider(<TradingBuyPreviewScreen />, {
            tradeType: 'buy',
            overrides: { wallet: { trading: tradingState } },
        });
    };

    it('returns null when providerMetadata is missing', () => {
        const { toJSON } = renderTradingBuyPreviewScreen({
            selectedQuote: mercuryoApplePayBuyQuote,
        });

        expect(toJSON()).toBeNull();
    });

    it('returns null when quote is missing', () => {
        const { toJSON } = renderTradingBuyPreviewScreen({
            providerMetadata: buyMercuryo,
        });

        expect(toJSON()).toBeNull();
    });

    it('renders screen title with company name when all data is provided', () => {
        const { getByText } = renderTradingBuyPreviewScreen({
            selectedQuote: mercuryoApplePayBuyQuote,
            providerMetadata: buyMercuryo,
        });

        expect(
            getByText(
                getTranslation('moduleTrading.tradingBuyPreviewScreen.title', {
                    companyName: buyMercuryo.companyName,
                }),
            ),
        ).toBeOnTheScreen();
    });
});
