import { getTranslation } from '@suite-native/intl';
import {
    eth1NormalAccount,
    getInitializedTradingState,
    moonpayCreditCardSellQuote,
    sellMoonpay,
} from '@suite-native/trading-fixtures';

import { TradingSellPreviewScreen } from './TradingSellPreviewScreen';
import { renderWithTradingProvider } from '../test-utils/tradingTestUtils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ setOptions: jest.fn(), replace: jest.fn() }),
    useRoute: () => ({ name: 'TradingSellPreview' }),
}));

const mockAnalyticsReport = jest.fn();
jest.mock('@suite-native/trading-analytics', () => ({
    ...jest.requireActual('@suite-native/trading-analytics'),
    useSellAnalyticReportCallback: () => mockAnalyticsReport,
}));

describe('TradingSellPreviewScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderScreen = ({ withQuote = true, withProvider = true } = {}) => {
        const tradingState = getInitializedTradingState('sell');
        tradingState.sell.selectedQuote = withQuote ? moonpayCreditCardSellQuote : undefined;
        tradingState.sell.tradingAccountKey = eth1NormalAccount.key;
        tradingState.currentProviderMetadata = withProvider ? sellMoonpay : undefined;

        return renderWithTradingProvider(<TradingSellPreviewScreen />, {
            tradeType: 'sell',
            overrides: { wallet: { trading: tradingState } },
        });
    };

    it('shows a general error without quote or provider metadata', () => {
        const { getByText } = renderScreen({ withQuote: false });

        expect(getByText(getTranslation('generic.unknownError'))).toBeOnTheScreen();
    });

    it('renders provider title and sell summary', () => {
        const { getByText } = renderScreen();

        expect(
            getByText(
                getTranslation('moduleTrading.tradingSellPreviewScreen.headerTitle', {
                    companyName: sellMoonpay.companyName,
                }),
            ),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingSellPreviewScreen.youPay')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingSellPreviewScreen.youGet')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingScreen.kycRequired')),
        ).toBeOnTheScreen();
    });

    it('reports a transaction-preview visit', () => {
        renderScreen();

        expect(mockAnalyticsReport).toHaveBeenCalledWith('transaction-preview', 'visit');
        expect(mockAnalyticsReport).toHaveBeenCalledTimes(1);
    });
});
