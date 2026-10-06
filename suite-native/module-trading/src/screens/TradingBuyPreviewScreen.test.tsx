import type { BuyTrade, ProviderMetadata } from 'invity-api';

import { events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import {
    buyMercuryo,
    getInitializedTradingState,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';

import { TradingBuyPreviewScreen } from './TradingBuyPreviewScreen';
import { renderWithTradingProvider } from '../test-utils/tradingTestUtils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ setOptions: jest.fn() }),
    useRoute: () => ({ name: 'TradingBuyPreviewScreen' }),
}));

const mockAnalyticsReport = jest.fn();
describe('TradingBuyPreviewScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderTradingBuyPreviewScreen = async ({
        providerMetadata,
        selectedQuote,
    }: {
        providerMetadata?: ProviderMetadata;
        selectedQuote?: BuyTrade;
    }) => {
        const tradingState = getInitializedTradingState('buy');
        tradingState.currentProviderMetadata = providerMetadata;
        tradingState.buy.selectedQuote = selectedQuote;

        return await renderWithTradingProvider(<TradingBuyPreviewScreen />, {
            tradeType: 'buy',
            services: { analytics: mockNativeAnalytics(mockAnalyticsReport) },
            overrides: { wallet: { trading: tradingState } },
        });
    };

    it('displays error when providerMetadata is missing', async () => {
        const { getByText } = await renderTradingBuyPreviewScreen({
            selectedQuote: mercuryoApplePayBuyQuote,
        });

        expect(getByText(getTranslation('generic.unknownError'))).toBeOnTheScreen();
    });

    it('displays error when quote is missing', async () => {
        const { getByText } = await renderTradingBuyPreviewScreen({
            providerMetadata: buyMercuryo,
        });

        expect(getByText(getTranslation('generic.unknownError'))).toBeOnTheScreen();
    });

    it('renders screen title with company name when all data is provided', async () => {
        const { getByText } = await renderTradingBuyPreviewScreen({
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

    it('should report buy-preview visit on mount', async () => {
        await renderTradingBuyPreviewScreen({
            selectedQuote: mercuryoApplePayBuyQuote,
            providerMetadata: buyMercuryo,
        });

        expect(mockAnalyticsReport).toHaveBeenCalledWith({
            type: events.tradingBuyEvent.name,
            payload: expect.objectContaining({ step: 'buy-preview', action: 'visit' }),
        });
        expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
    });
});
