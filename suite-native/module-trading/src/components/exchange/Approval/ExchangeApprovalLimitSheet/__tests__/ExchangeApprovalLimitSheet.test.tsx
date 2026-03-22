import { getTranslation } from '@suite-native/intl';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import { exchangeQuotes, getInitializedTradingState } from '@suite-native/trading-fixtures';

import { ExchangeApprovalLimitSheet } from '../ExchangeApprovalLimitSheet';

const mockOnDismiss = jest.fn();
const mockOnApprovalTypeSelect = jest.fn();

const testQuote = exchangeQuotes[0];

const getPreloadedState = (): PreloadedState => ({
    wallet: {
        trading: {
            ...getInitializedTradingState('exchange'),
            exchange: {
                ...getInitializedTradingState('exchange').exchange,
                selectedQuote: testQuote,
            },
        },
    },
});

const renderSheet = (
    isVisible = true,
    quote = testQuote,
    selectedApprovalType: 'INFINITE' | 'MINIMAL' = 'INFINITE',
) =>
    renderWithStoreProvider(
        <ExchangeApprovalLimitSheet
            isVisible={isVisible}
            onDismiss={mockOnDismiss}
            quote={quote}
            onApprovalTypeSelect={mockOnApprovalTypeSelect}
            selectedApprovalType={selectedApprovalType}
        />,
        { preloadedState: getPreloadedState() },
    );

describe('ExchangeApprovalLimitSheet', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the sheet when visible', () => {
        const { getByText } = renderSheet();

        expect(getByText('Unlimited')).toBeTruthy();
        expect(getByText('100 USDC')).toBeTruthy();
    });

    it('should render unlimited approval option with correct details', () => {
        const { getByText } = renderSheet();

        expect(getByText('Unlimited')).toBeTruthy();
        expect(
            getByText(
                getTranslation('moduleTrading.exchangeApprovalLimitSheet.unlimitedCard.info'),
            ),
        ).toBeTruthy();
        expect(
            getByText(
                getTranslation('moduleTrading.exchangeApprovalLimitSheet.unlimitedCard.alert', {
                    coinSymbol: 'USDC',
                }),
            ),
        ).toBeTruthy();
    });

    it('should render limited approval option with correct amount', () => {
        const { getByText } = renderSheet();

        expect(getByText('100 USDC')).toBeTruthy();
        expect(
            getByText(getTranslation('moduleTrading.exchangeApprovalLimitSheet.limitedCard.info')),
        ).toBeTruthy();
    });

    it('should render crypto icons for both cards', () => {
        const { getAllByLabelText } = renderSheet();

        const cryptoIcons = getAllByLabelText('eth0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
        expect(cryptoIcons).toHaveLength(2);
    });

    it('should display quote sendStringAmount in limited approval option', () => {
        const customQuote = {
            ...testQuote,
            sendStringAmount: '250',
        };
        const { getByText } = renderSheet(true, customQuote);

        expect(getByText('250 USDC')).toBeTruthy();
    });

    it('should pass correct props when INFINITE is selected', () => {
        renderSheet(true, testQuote, 'INFINITE');

        expect(mockOnApprovalTypeSelect).toBeDefined();
    });

    it('should pass correct props when MINIMAL is selected', () => {
        renderSheet(true, testQuote, 'MINIMAL');

        expect(mockOnApprovalTypeSelect).toBeDefined();
    });
});
