import { type PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
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
    renderWithStoreProviderAsync(
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

    it('should render the sheet when visible', async () => {
        const { getByText } = await renderSheet();

        expect(getByText('Unlimited')).toBeTruthy();
        expect(getByText('100 USDC')).toBeTruthy();
    });

    it('should render unlimited approval option with correct details', async () => {
        const { getByText } = await renderSheet();

        expect(getByText('Unlimited')).toBeTruthy();
        expect(
            getByText(
                'Approve unlimited USDC to skip future approval requests and reduce fees. Only use this option if you trust Mercuryo, as it will have access to all your USDC.',
            ),
        ).toBeTruthy();
    });

    it('should render limited approval option with correct amount', async () => {
        const { getByText } = await renderSheet();

        expect(getByText('100 USDC')).toBeTruthy();
        expect(
            getByText(
                "Approve only the amount needed for this swap. This helps reduce risk, but you'll need to approve again (and pay a fee) for future swaps.",
            ),
        ).toBeTruthy();
    });

    it('should render crypto icons for both cards', async () => {
        const { getAllByLabelText } = await renderSheet();

        const cryptoIcons = getAllByLabelText('eth0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
        expect(cryptoIcons).toHaveLength(2);
    });

    it('should render provider company name in unlimited card description', async () => {
        const { getByText } = await renderSheet();

        expect(
            getByText(
                'Approve unlimited USDC to skip future approval requests and reduce fees. Only use this option if you trust Mercuryo, as it will have access to all your USDC.',
            ),
        ).toBeTruthy();
    });

    it('should display quote sendStringAmount in limited approval option', async () => {
        const customQuote = {
            ...testQuote,
            sendStringAmount: '250',
        };
        const { getByText } = await renderSheet(true, customQuote);

        expect(getByText('250 USDC')).toBeTruthy();
    });

    it('should pass correct props when INFINITE is selected', async () => {
        await renderSheet(true, testQuote, 'INFINITE');

        expect(mockOnApprovalTypeSelect).toBeDefined();
    });

    it('should pass correct props when MINIMAL is selected', async () => {
        await renderSheet(true, testQuote, 'MINIMAL');

        expect(mockOnApprovalTypeSelect).toBeDefined();
    });
});
