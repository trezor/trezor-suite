import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { exchangeQuotes } from '../../../../__fixtures__/exchangeQuotes';
import { getInitializedTradingState } from '../../../../__fixtures__/tradingState';
import { ExchangeApprovalLimitSheet } from '../ExchangeApprovalLimitSheet';

const mockOnDismiss = jest.fn();

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

const getPreloadedStateWithoutQuote = (): PreloadedState => ({
    wallet: {
        trading: {
            ...getInitializedTradingState('exchange'),
            exchange: {
                ...getInitializedTradingState('exchange').exchange,
                selectedQuote: undefined,
            },
        },
    },
});

const renderSheet = (isVisible = true, preloadedState = getPreloadedState()) =>
    renderWithStoreProviderAsync(
        <ExchangeApprovalLimitSheet isVisible={isVisible} onDismiss={mockOnDismiss} />,
        { preloadedState },
    );

describe('ExchangeApprovalLimitSheet', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render nothing when quote is not available', async () => {
        const { toJSON } = await renderSheet(true, getPreloadedStateWithoutQuote());

        expect(toJSON()).toBeNull();
    });

    it('should render the sheet when visible', async () => {
        const { getByText } = await renderSheet();

        expect(getByText('Unlimited')).toBeTruthy();
        expect(getByText('200.32 USDC')).toBeTruthy();
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

        expect(getByText('200.32 USDC')).toBeTruthy();
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
});
