import type { BuyTrade, ProviderMetadata } from 'invity-api';

import { getTranslation } from '@suite-native/intl';
import {
    buyMercuryo,
    getInitializedTradingState,
    mercuryoApplePayBuyQuote,
} from '@suite-native/trading-fixtures';

import { TradingBuyPreviewScreen } from './TradingBuyPreviewScreen';
import { renderWithTradingProvider } from '../__tests__/tradingTestUtils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ setOptions: jest.fn() }),
    useRoute: () => ({ name: 'TradingBuyPreviewScreen' }),
}));

const mockAnalyticsReport = jest.fn();
jest.mock('@suite-native/trading-analytics', () => ({
    ...jest.requireActual('@suite-native/trading-analytics'),
    useBuyAnalyticsStepReport:
        (step: unknown) =>
        (...args: unknown[]) =>
            mockAnalyticsReport(step, ...args),
}));

describe('TradingBuyPreviewScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

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

    it('displays error when providerMetadata is missing', () => {
        const { getByText } = renderTradingBuyPreviewScreen({
            selectedQuote: mercuryoApplePayBuyQuote,
        });

        expect(getByText(getTranslation('generic.unknownError'))).toBeOnTheScreen();
    });

    it('displays error when quote is missing', () => {
        const { getByText } = renderTradingBuyPreviewScreen({
            providerMetadata: buyMercuryo,
        });

        expect(getByText(getTranslation('generic.unknownError'))).toBeOnTheScreen();
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

    it('should report buy-preview visit on mount', () => {
        renderTradingBuyPreviewScreen({
            selectedQuote: mercuryoApplePayBuyQuote,
            providerMetadata: buyMercuryo,
        });

        expect(mockAnalyticsReport).toHaveBeenCalledWith('buy-preview', 'visit');
        expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
    });
});
